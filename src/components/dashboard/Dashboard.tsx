"use client";

import { useEffect, useState } from "react";
import { accountStore, billStore, debtStore, incomeStore } from "@/lib/storage";
import { ReminderBanner } from "./ReminderBanner";
import { SummaryStrip } from "./SummaryStrip";
import { PayFirstSection } from "./PayFirstSection";
import { IncomeTargetSection } from "./IncomeTargetSection";
import { AccountsSection } from "./AccountsSection";
import { BillsSection } from "./BillsSection";
import { DebtsSection } from "./DebtsSection";
import { IncomeSection } from "./IncomeSection";
import { SmartEntry } from "./SmartEntry";
import { AISettingsSection } from "./AISettingsSection";
import { ReminderSettingsSection } from "./ReminderSettingsSection";
import { BackupSection } from "./BackupSection";
import { CloudSyncSection } from "./CloudSyncSection";
import { ReceiptsSection } from "./ReceiptsSection";
import { BottomTabBar } from "./BottomTabBar";
import { useReminderSettings } from "@/lib/reminderSettings";
import { rescheduleReminders } from "@/lib/notifications";
import { useCloudSync } from "@/lib/cloudSync/useCloudSync";

type TabId = "overview" | "bills" | "debts" | "accounts" | "income" | "receipts";

const TITLES: Record<TabId, string> = {
  overview: "Dashboard",
  bills: "Bills",
  debts: "Debts",
  accounts: "Accounts",
  income: "Income",
  receipts: "Receipts",
};

export function Dashboard() {
  const accounts = accountStore.useAll();
  const bills = billStore.useAll();
  const debts = debtStore.useAll();
  const income = incomeStore.useAll();
  const reminderSettings = useReminderSettings();
  const [tab, setTab] = useState<TabId>("overview");
  const cloudSyncStatus = useCloudSync({ accounts, bills, debts, income });

  // Recompute and reschedule every local notification whenever the
  // underlying data or the reminder preferences change (no-ops outside the
  // native app — see rescheduleReminders).
  useEffect(() => {
    rescheduleReminders(bills, debts, reminderSettings).catch((err) => {
      console.error("Failed to reschedule reminders", err);
    });
  }, [bills, debts, reminderSettings]);

  // iOS Safari doesn't blur a focused input when you tap elsewhere on the
  // page, so the software keyboard stays open until you tap another field.
  useEffect(() => {
    function dismissKeyboardOnOutsideTap(e: PointerEvent) {
      const active = document.activeElement as HTMLElement | null;
      if (!active || (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA")) return;
      const target = e.target as HTMLElement;
      if (active.contains(target) || target.closest("input, textarea, select")) return;
      active.blur();
    }
    document.addEventListener("pointerdown", dismissKeyboardOnOutsideTap);
    return () => document.removeEventListener("pointerdown", dismissKeyboardOnOutsideTap);
  }, []);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-4xl flex-col">
      <header className="safe-top px-5 pt-6 pb-2">
        <p className="text-xs font-semibold tracking-wide text-teal uppercase">MyMoney</p>
        <h1 className="text-[34px] leading-tight font-bold tracking-tight text-nowrap">
          {TITLES[tab]}
        </h1>
      </header>

      <div
        className="flex flex-col gap-5 px-4 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 140px)" }}
      >
        {tab === "overview" && (
          <>
            <ReminderBanner bills={bills} debts={debts} />
            <CloudSyncSection status={cloudSyncStatus} />
            <SummaryStrip accounts={accounts} bills={bills} debts={debts} />
            <PayFirstSection bills={bills} debts={debts} />
            <IncomeTargetSection accounts={accounts} bills={bills} debts={debts} income={income} />
            <AISettingsSection />
            <ReminderSettingsSection />
            <SmartEntry
              accounts={accounts}
              onAddBill={(input) => billStore.create({ ...input, status: "upcoming" })}
              onAddDebt={debtStore.create}
            />
            <BackupSection />
          </>
        )}

        {tab === "bills" && (
          <BillsSection
            bills={bills}
            accounts={accounts}
            onAdd={(input) => billStore.create({ ...input, status: "upcoming" })}
            onUpdate={billStore.update}
            onRemove={billStore.remove}
            onTogglePaid={(id, paid) => billStore.update(id, { status: paid ? "paid" : "upcoming" })}
          />
        )}

        {tab === "debts" && (
          <DebtsSection
            debts={debts}
            accounts={accounts}
            onAdd={debtStore.create}
            onRemove={debtStore.remove}
            onToggleLate={(id, isLate) => debtStore.update(id, { isLate })}
          />
        )}

        {tab === "accounts" && (
          <AccountsSection accounts={accounts} onAdd={accountStore.create} onRemove={accountStore.remove} />
        )}

        {tab === "income" && (
          <IncomeSection income={income} onAdd={incomeStore.create} onRemove={incomeStore.remove} />
        )}

        {tab === "receipts" && <ReceiptsSection bills={bills} />}
      </div>

      <BottomTabBar active={tab} onChange={(id) => setTab(id as TabId)} />
    </div>
  );
}
