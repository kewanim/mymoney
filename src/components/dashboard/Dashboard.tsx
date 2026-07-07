"use client";

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

export function Dashboard() {
  const accounts = accountStore.useAll();
  const bills = billStore.useAll();
  const debts = debtStore.useAll();
  const income = incomeStore.useAll();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">MyMoney</p>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      </header>

      <ReminderBanner bills={bills} debts={debts} />

      <SummaryStrip accounts={accounts} bills={bills} debts={debts} />

      <PayFirstSection bills={bills} debts={debts} />

      <IncomeTargetSection accounts={accounts} bills={bills} debts={debts} income={income} />

      <SmartEntry
        accounts={accounts}
        onAddBill={(input) => billStore.create({ ...input, status: "upcoming" })}
        onAddDebt={debtStore.create}
      />

      <AccountsSection accounts={accounts} onAdd={accountStore.create} onRemove={accountStore.remove} />

      <BillsSection
        bills={bills}
        accounts={accounts}
        onAdd={(input) => billStore.create({ ...input, status: "upcoming" })}
        onRemove={billStore.remove}
        onTogglePaid={(id, paid) => billStore.update(id, { status: paid ? "paid" : "upcoming" })}
      />

      <DebtsSection
        debts={debts}
        accounts={accounts}
        onAdd={debtStore.create}
        onRemove={debtStore.remove}
        onToggleLate={(id, isLate) => debtStore.update(id, { isLate })}
      />

      <IncomeSection income={income} onAdd={incomeStore.create} onRemove={incomeStore.remove} />
    </div>
  );
}
