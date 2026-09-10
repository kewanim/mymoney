"use client";

import { useEffect, useRef, useState } from "react";
import type { Account, Bill, Debt, Income } from "@/lib/types";
import { accountStore, billStore, debtStore, incomeStore } from "@/lib/storage";
import { getLastLocalChangeAt } from "@/lib/storage/changeClock";
import { CloudSync } from "./plugin";
import { isCloudSyncSupported } from "./platform";

export type CloudSyncStatus =
  | { state: "unsupported" }
  | { state: "checking" }
  | { state: "noAccount" }
  | { state: "syncing" }
  | { state: "synced"; at: string }
  | { state: "error"; message: string };

const PUSH_DEBOUNCE_MS = 2500;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Couldn't reach iCloud.";
}

// Automates what the manual Export/Import backup already does: mirrors the
// same four JSON arrays to the user's private iCloud, and pulls them back
// down on other devices. One pull on launch to reconcile, then a debounced
// push on every local change. Last full save wins on conflict — reasonable
// for one person on 1-2 personal devices, not a general multi-writer sync
// engine (see CloudSyncPlugin.swift for the fuller rationale).
export function useCloudSync({
  accounts,
  bills,
  debts,
  income,
}: {
  accounts: Account[];
  bills: Bill[];
  debts: Debt[];
  income: Income[];
}): CloudSyncStatus {
  const supported = isCloudSyncSupported();
  const [status, setStatus] = useState<CloudSyncStatus>(supported ? { state: "checking" } : { state: "unsupported" });
  const pullStarted = useRef(false);
  const pullCompleted = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull once on launch, before any push is allowed to run — otherwise a
  // push could fire from the initial render and clobber a newer remote copy
  // before we've had a chance to compare against it.
  useEffect(() => {
    if (!supported || pullStarted.current) return;
    pullStarted.current = true;

    (async () => {
      try {
        const account = await CloudSync.accountStatus();
        if (account.status !== "available") {
          setStatus(
            account.status === "noAccount"
              ? { state: "noAccount" }
              : { state: "error", message: "iCloud isn't available on this device right now." },
          );
          return;
        }

        const remote = await CloudSync.fetchAppData();
        if (remote.found) {
          const localChangedAt = getLastLocalChangeAt();
          if (!localChangedAt || remote.updatedAt > localChangedAt) {
            accountStore.setAll(JSON.parse(remote.accountsJSON) as Account[]);
            billStore.setAll(JSON.parse(remote.billsJSON) as Bill[]);
            debtStore.setAll(JSON.parse(remote.debtsJSON) as Debt[]);
            incomeStore.setAll(JSON.parse(remote.incomeJSON) as Income[]);
          }
        }

        // Push once right after reconciling, reading straight from the
        // stores (not the hook's props, which may be a render behind). This
        // is what carries a brand-new device's pre-existing local data up to
        // iCloud the first time sync turns on — otherwise nothing pushes
        // until the user's next edit, since the debounced push effect below
        // only fires on a prop change, and a pull that found nothing to
        // merge doesn't produce one.
        const result = await CloudSync.saveAppData({
          accountsJSON: JSON.stringify(accountStore.getAll()),
          billsJSON: JSON.stringify(billStore.getAll()),
          debtsJSON: JSON.stringify(debtStore.getAll()),
          incomeJSON: JSON.stringify(incomeStore.getAll()),
        });
        setStatus({ state: "synced", at: result.updatedAt });
      } catch (err) {
        setStatus({ state: "error", message: errorMessage(err) });
      } finally {
        pullCompleted.current = true;
      }
    })();
  }, [supported]);

  // Debounced push whenever local data changes, once the initial pull has
  // settled (so we never push a stale pre-pull snapshot over a newer remote).
  useEffect(() => {
    if (!supported || !pullCompleted.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);

    pushTimer.current = setTimeout(() => {
      setStatus({ state: "syncing" });
      CloudSync.saveAppData({
        accountsJSON: JSON.stringify(accounts),
        billsJSON: JSON.stringify(bills),
        debtsJSON: JSON.stringify(debts),
        incomeJSON: JSON.stringify(income),
      })
        .then((result) => setStatus({ state: "synced", at: result.updatedAt }))
        .catch((err) => setStatus({ state: "error", message: errorMessage(err) }));
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [supported, accounts, bills, debts, income]);

  return status;
}
