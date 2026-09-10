import { registerPlugin } from "@capacitor/core";

// TS side of the custom native CloudSyncPlugin (ios/App/App/CloudSyncPlugin.swift).
// Not an npm plugin — it's in-app-only code, registered manually from
// MainViewController.swift. Only implemented on iOS; calling any of this on
// web/Android rejects immediately (see isCloudSyncSupported before calling).

export type ICloudAccountStatus =
  | "available"
  | "noAccount"
  | "restricted"
  | "couldNotDetermine"
  | "temporarilyUnavailable";

export interface AppDataPayload {
  accountsJSON: string;
  billsJSON: string;
  debtsJSON: string;
  incomeJSON: string;
}

export type FetchedAppData =
  | { found: true; accountsJSON: string; billsJSON: string; debtsJSON: string; incomeJSON: string; updatedAt: string }
  | { found: false };

export interface ReceiptRecord {
  id: string;
  billId: string;
  fileName: string;
  createdAt: string;
  base64: string;
}

export interface CloudSyncPlugin {
  accountStatus(): Promise<{ status: ICloudAccountStatus }>;
  saveAppData(payload: AppDataPayload): Promise<{ updatedAt: string }>;
  fetchAppData(): Promise<FetchedAppData>;
  saveReceipt(payload: {
    billId: string;
    fileName: string;
    base64: string;
  }): Promise<{ id: string; billId: string; fileName: string; createdAt: string }>;
  fetchReceipts(payload?: { billId?: string }): Promise<{ receipts: ReceiptRecord[] }>;
  deleteReceipt(payload: { id: string }): Promise<void>;
}

export const CloudSync = registerPlugin<CloudSyncPlugin>("CloudSync");
