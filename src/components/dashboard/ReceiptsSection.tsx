"use client";

import { useEffect, useState } from "react";
import type { Bill } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { CloudSync, type ReceiptRecord } from "@/lib/cloudSync/plugin";
import { isCloudSyncSupported } from "@/lib/cloudSync/platform";
import { Card, SectionHeading, EmptyState, IconButton, FieldSelect } from "./ui";

// Receipts live entirely in iCloud (via CloudSyncPlugin's CKAsset-backed
// "Receipt" records) — there's no local mirror. Unlike the bill/debt/account/
// income JSON blob, photos are too large to duplicate into localStorage, and
// this feature only makes sense once iCloud is available anyway.

const IMAGE_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

function imageMimeType(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_MIME[ext] ?? null;
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function ReceiptsSection({ bills }: { bills: Bill[] }) {
  const supported = isCloudSyncSupported();
  const [receipts, setReceipts] = useState<ReceiptRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billId, setBillId] = useState("");
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setError(null);
    try {
      const result = await CloudSync.fetchReceipts();
      setReceipts(result.receipts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load receipts.");
    }
  }

  useEffect(() => {
    if (supported) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !billId) return;
    setUploading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      await CloudSync.saveReceipt({ billId, fileName: file.name, base64 });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that receipt.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(receipt: ReceiptRecord) {
    setError(null);
    try {
      await CloudSync.deleteReceipt({ id: receipt.id });
      setReceipts((prev) => prev?.filter((r) => r.id !== receipt.id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that receipt.");
    }
  }

  if (!supported) {
    return (
      <Card>
        <SectionHeading title="Receipts" count={0} action={null} />
        <EmptyState label="Receipts sync through iCloud, so they're only available in the iOS app." />
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeading title="Receipts" count={receipts?.length ?? 0} action={null} />
      <p className="mb-3 text-sm text-ink-soft">
        Attach a photo or PDF to a bill. It's stored in your iCloud, not anywhere of ours.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border border-field-border p-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-soft">Bill</span>
          <FieldSelect value={billId} onChange={(e) => setBillId(e.target.value)}>
            <option value="">Choose a bill</option>
            {bills.map((bill) => (
              <option key={bill.id} value={bill.id}>
                {bill.name}
              </option>
            ))}
          </FieldSelect>
        </label>
        <label
          className={`rounded-full bg-field px-4 py-1.5 text-sm font-semibold text-ink ${
            billId && !uploading ? "cursor-pointer" : "cursor-not-allowed opacity-40"
          }`}
        >
          {uploading ? "Uploading…" : "Choose file"}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            disabled={!billId || uploading}
            onChange={handleFile}
          />
        </label>
      </div>

      {error && <p className="mb-3 text-sm text-critical">{error}</p>}

      {receipts === null ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : receipts.length === 0 ? (
        <EmptyState label="No receipts yet. Attach one to a bill above." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {receipts.map((receipt) => {
            const bill = bills.find((b) => b.id === receipt.billId);
            const mime = imageMimeType(receipt.fileName);
            return (
              <li key={receipt.id} className="relative overflow-hidden rounded-2xl bg-field">
                {mime ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:${mime};base64,${receipt.base64}`}
                    alt={receipt.fileName}
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center text-3xl">📄</div>
                )}
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{bill?.name ?? "Unlinked bill"}</p>
                  <p className="truncate text-[11px] text-ink-soft">{formatDate(receipt.createdAt.slice(0, 10))}</p>
                </div>
                <div className="absolute top-1 right-1">
                  <IconButton label={`Delete ${receipt.fileName}`} onClick={() => handleDelete(receipt)}>
                    ✕
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
