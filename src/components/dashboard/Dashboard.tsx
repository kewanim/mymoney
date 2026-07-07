"use client";

import { useState } from "react";
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
import { BackupSection } from "./BackupSection";
import { Tabs } from "./Tabs";

type TabId = "overview" | "bills" | "debts" | "accounts" | "income";

export function Dashboard() {
  const accounts = accountStore.useAll();
  const bills = billStore.useAll();
  const debts = debtStore.useAll();
  const income = incomeStore.useAll();
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-5 px-4 py-8 sm:py-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">MyMoney</p>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      </header>

      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "bills", label: "Bills", count: bills.length },
          { id: "debts", label: "Debts", count: debts.length },
          { id: "accounts", label: "Accounts", count: accounts.length },
          { id: "income", label: "Income", count: income.length },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "overview" && (
        <div className="flex flex-col gap-5">
          <ReminderBanner bills={bills} debts={debts} />
          <SummaryStrip accounts={accounts} bills={bills} debts={debts} />
          <PayFirstSection bills={bills} debts={debts} />
          <IncomeTargetSection accounts={accounts} bills={bills} debts={debts} income={income} />
          <SmartEntry
            accounts={accounts}
            onAddBill={(input) => billStore.create({ ...input, status: "upcoming" })}
            onAddDebt={debtStore.create}
          />
          <BackupSection />
        </div>
      )}

      {tab === "bills" && (
        <BillsSection
          bills={bills}
          accounts={accounts}
          onAdd={(input) => billStore.create({ ...input, status: "upcoming" })}
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
    </div>
  );
}
