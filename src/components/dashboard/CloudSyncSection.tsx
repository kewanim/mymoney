import type { CloudSyncStatus } from "@/lib/cloudSync/useCloudSync";
import { Card, Badge } from "./ui";

const BADGE_LABEL: Record<CloudSyncStatus["state"], string> = {
  unsupported: "Local only",
  checking: "Checking",
  noAccount: "Not signed in",
  syncing: "Syncing",
  synced: "Synced",
  error: "Error",
};

const TONE: Record<CloudSyncStatus["state"], "neutral" | "warn" | "good" | "critical"> = {
  unsupported: "neutral",
  checking: "neutral",
  noAccount: "warn",
  syncing: "neutral",
  synced: "good",
  error: "critical",
};

const DETAIL: Partial<Record<CloudSyncStatus["state"], string>> = {
  unsupported: "Open the iOS app to back up to iCloud — this browser stays local-only.",
  noAccount: "Sign into iCloud in this device's Settings app to start backing up.",
};

export function CloudSyncSection({ status }: { status: CloudSyncStatus }) {
  const detail = status.state === "error" ? status.message : DETAIL[status.state];
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">iCloud backup</p>
          <p className="text-xs text-ink-soft">Bills, debts, accounts, and income mirror automatically.</p>
        </div>
        <Badge tone={TONE[status.state]}>{BADGE_LABEL[status.state]}</Badge>
      </div>
      {detail && <p className="mt-2 text-xs text-ink-soft">{detail}</p>}
    </Card>
  );
}
