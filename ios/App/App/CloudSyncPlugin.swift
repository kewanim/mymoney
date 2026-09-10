import Foundation
import Capacitor
import CloudKit

// Bridges MyMoney's data to the user's own private iCloud account — no
// server of ours involved. Two record types in the private database:
//   - "AppData": one singleton record mirroring the same JSON shape the
//     manual Export Backup feature already produces (see src/lib/backup.ts),
//     just kept in sync automatically instead of by hand.
//   - "Receipt": one record per uploaded photo/PDF, holding a CKAsset (the
//     file itself) plus which bill it belongs to.
// Conflict handling is intentionally simple: last full save wins. That's a
// fair tradeoff for one person on 1-2 personal devices, not a general
// multi-writer sync engine.
@objc(CloudSyncPlugin)
public class CloudSyncPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CloudSyncPlugin"
    public let jsName = "CloudSync"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "accountStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveAppData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fetchAppData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveReceipt", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fetchReceipts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteReceipt", returnType: CAPPluginReturnPromise)
    ]

    private let containerIdentifier = "iCloud.com.kewani.mymoney"
    private let appDataRecordType = "AppData"
    private let appDataRecordName = "app-data"
    private let receiptRecordType = "Receipt"

    private var container: CKContainer {
        CKContainer(identifier: containerIdentifier)
    }

    private var database: CKDatabase {
        container.privateCloudDatabase
    }

    // MARK: - Account status

    @objc func accountStatus(_ call: CAPPluginCall) {
        Task {
            do {
                let status = try await container.accountStatus()
                call.resolve(["status": Self.describe(status)])
            } catch {
                call.reject("Couldn't check iCloud account status.", nil, error)
            }
        }
    }

    private static func describe(_ status: CKAccountStatus) -> String {
        switch status {
        case .available: return "available"
        case .noAccount: return "noAccount"
        case .restricted: return "restricted"
        case .couldNotDetermine: return "couldNotDetermine"
        case .temporarilyUnavailable: return "temporarilyUnavailable"
        @unknown default: return "couldNotDetermine"
        }
    }

    // MARK: - App data (accounts/bills/debts/income, one JSON blob each)

    @objc func saveAppData(_ call: CAPPluginCall) {
        guard let accountsJSON = call.getString("accountsJSON"),
              let billsJSON = call.getString("billsJSON"),
              let debtsJSON = call.getString("debtsJSON"),
              let incomeJSON = call.getString("incomeJSON") else {
            call.reject("Missing one of accountsJSON/billsJSON/debtsJSON/incomeJSON.")
            return
        }

        Task {
            do {
                let recordID = CKRecord.ID(recordName: appDataRecordName)
                let record = try await fetchOrCreateRecord(recordType: appDataRecordType, recordID: recordID)

                let updatedAt = Date()
                record["accountsJSON"] = accountsJSON as CKRecordValue
                record["billsJSON"] = billsJSON as CKRecordValue
                record["debtsJSON"] = debtsJSON as CKRecordValue
                record["incomeJSON"] = incomeJSON as CKRecordValue
                record["updatedAt"] = updatedAt as CKRecordValue

                _ = try await database.save(record)
                call.resolve(["updatedAt": Self.iso8601.string(from: updatedAt)])
            } catch {
                call.reject("Couldn't save to iCloud.", nil, error)
            }
        }
    }

    @objc func fetchAppData(_ call: CAPPluginCall) {
        Task {
            do {
                let recordID = CKRecord.ID(recordName: appDataRecordName)
                let record = try await database.record(for: recordID)
                let updatedAt = record["updatedAt"] as? Date ?? Date(timeIntervalSince1970: 0)
                call.resolve([
                    "found": true,
                    "accountsJSON": record["accountsJSON"] as? String ?? "[]",
                    "billsJSON": record["billsJSON"] as? String ?? "[]",
                    "debtsJSON": record["debtsJSON"] as? String ?? "[]",
                    "incomeJSON": record["incomeJSON"] as? String ?? "[]",
                    "updatedAt": Self.iso8601.string(from: updatedAt)
                ])
            } catch let error as CKError where error.code == .unknownItem {
                // Nothing saved to iCloud yet — not an error, just a fresh account.
                call.resolve(["found": false])
            } catch {
                call.reject("Couldn't fetch from iCloud.", nil, error)
            }
        }
    }

    private func fetchOrCreateRecord(recordType: String, recordID: CKRecord.ID) async throws -> CKRecord {
        do {
            return try await database.record(for: recordID)
        } catch let error as CKError where error.code == .unknownItem {
            return CKRecord(recordType: recordType, recordID: recordID)
        }
    }

    // MARK: - Receipts (one CKAsset per uploaded photo/PDF, linked to a bill)

    @objc func saveReceipt(_ call: CAPPluginCall) {
        guard let billId = call.getString("billId"),
              let fileName = call.getString("fileName"),
              let base64 = call.getString("base64") else {
            call.reject("Missing one of billId/fileName/base64.")
            return
        }
        guard let data = Data(base64Encoded: base64) else {
            call.reject("That file's data couldn't be decoded.")
            return
        }

        let tmpURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        do {
            try data.write(to: tmpURL)
        } catch {
            call.reject("Couldn't stage that file for upload.", nil, error)
            return
        }

        Task {
            defer { try? FileManager.default.removeItem(at: tmpURL) }
            do {
                let record = CKRecord(recordType: receiptRecordType)
                let createdAt = Date()
                record["billId"] = billId as CKRecordValue
                record["fileName"] = fileName as CKRecordValue
                record["createdAt"] = createdAt as CKRecordValue
                record["photo"] = CKAsset(fileURL: tmpURL)

                let saved = try await database.save(record)
                call.resolve([
                    "id": saved.recordID.recordName,
                    "billId": billId,
                    "fileName": fileName,
                    "createdAt": Self.iso8601.string(from: createdAt)
                ])
            } catch {
                call.reject("Couldn't upload that receipt to iCloud.", nil, error)
            }
        }
    }

    @objc func fetchReceipts(_ call: CAPPluginCall) {
        let billId = call.getString("billId")

        Task {
            do {
                let predicate: NSPredicate = billId.map { NSPredicate(format: "billId == %@", $0) } ?? NSPredicate(value: true)
                let query = CKQuery(recordType: receiptRecordType, predicate: predicate)
                query.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]

                let (matchResults, _) = try await database.records(matching: query)

                var receipts: [[String: Any]] = []
                for (_, result) in matchResults {
                    guard case .success(let record) = result else { continue }
                    guard let asset = record["photo"] as? CKAsset, let fileURL = asset.fileURL,
                          let data = try? Data(contentsOf: fileURL) else { continue }
                    let createdAt = record["createdAt"] as? Date ?? Date(timeIntervalSince1970: 0)
                    receipts.append([
                        "id": record.recordID.recordName,
                        "billId": record["billId"] as? String ?? "",
                        "fileName": record["fileName"] as? String ?? "receipt",
                        "createdAt": Self.iso8601.string(from: createdAt),
                        "base64": data.base64EncodedString()
                    ])
                }
                call.resolve(["receipts": receipts])
            } catch {
                call.reject("Couldn't fetch receipts from iCloud.", nil, error)
            }
        }
    }

    @objc func deleteReceipt(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing id.")
            return
        }

        Task {
            do {
                _ = try await database.deleteRecord(withID: CKRecord.ID(recordName: id))
                call.resolve()
            } catch {
                call.reject("Couldn't delete that receipt from iCloud.", nil, error)
            }
        }
    }

    private static let iso8601: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
}
