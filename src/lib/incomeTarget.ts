import type { Account, Bill, Debt, Income } from "@/lib/types";
import { daysUntil } from "@/lib/format";

export interface IncomeTargetResult {
  horizonDays: number;
  totalDue: number;
  availableBalance: number;
  expectedIncome: number;
  gap: number;
  dailyTarget: number;
  weeklyTarget: number;
}

// "Available" cash only counts accounts you can actually spend from today —
// a credit card's currentBalance is what you owe, not what you have.
function availableBalance(accounts: Account[]): number {
  return accounts
    .filter((a) => a.type !== "credit_card")
    .reduce((sum, a) => sum + a.currentBalance, 0);
}

function billsDueWithin(bills: Bill[], horizonDays: number): number {
  return bills
    .filter((b) => b.status !== "paid" && daysUntil(b.dueDate) <= horizonDays)
    .reduce((sum, b) => sum + b.amount, 0);
}

// Late debts need addressing regardless of the horizon; debts with a due
// date only count if that date falls inside the window being planned for.
function debtsDueWithin(debts: Debt[], horizonDays: number): number {
  return debts
    .filter((d) => d.isLate || (d.dueDate != null && daysUntil(d.dueDate) <= horizonDays))
    .reduce((sum, d) => sum + (d.minimumPayment ?? d.currentBalance), 0);
}

function incomeExpectedWithin(income: Income[], horizonDays: number): number {
  return income
    .filter((i) => i.nextExpectedDate != null && daysUntil(i.nextExpectedDate) <= horizonDays)
    .reduce((sum, i) => sum + i.amount, 0);
}

export function calculateIncomeTarget(
  { accounts, bills, debts, income }: { accounts: Account[]; bills: Bill[]; debts: Debt[]; income: Income[] },
  horizonDays: number,
): IncomeTargetResult {
  const totalDue = billsDueWithin(bills, horizonDays) + debtsDueWithin(debts, horizonDays);
  const balance = availableBalance(accounts);
  const expectedIncome = incomeExpectedWithin(income, horizonDays);
  const gap = Math.max(0, totalDue - balance - expectedIncome);

  return {
    horizonDays,
    totalDue,
    availableBalance: balance,
    expectedIncome,
    gap,
    dailyTarget: gap / horizonDays,
    weeklyTarget: (gap / horizonDays) * 7,
  };
}
