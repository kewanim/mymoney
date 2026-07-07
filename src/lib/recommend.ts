import type { Bill, Debt } from "@/lib/types";
import { daysUntil, displayBillStatus, formatCurrency } from "@/lib/format";

export interface PayRecommendation {
  id: string;
  kind: "bill" | "debt";
  name: string;
  amount: number;
  score: number;
  reasons: string[];
}

// Weights are deliberately simple and additive: being overdue/late dominates
// everything else, a penalty about to hit is the next most urgent signal,
// and interest rate is a smaller, steady nudge (it costs you every day it's
// unpaid, but it's rarely as urgent as a looming penalty or a late mark).
function scoreBill(bill: Bill): { score: number; reasons: string[] } {
  const status = displayBillStatus(bill);
  const reasons: string[] = [];
  let score = 0;

  if (status === "overdue") {
    const lateDays = -daysUntil(bill.dueDate);
    score += 100 + lateDays * 2;
    reasons.push(`${lateDays} day${lateDays === 1 ? "" : "s"} overdue`);
  } else if (status === "due_today") {
    score += 40;
    reasons.push("Due today");
  } else {
    const days = daysUntil(bill.dueDate);
    if (days <= 3) {
      score += 20 - days * 2;
      reasons.push(`Due in ${days} day${days === 1 ? "" : "s"}`);
    }
  }

  return { score, reasons };
}

function scoreDebt(debt: Debt): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (debt.isLate) {
    score += 100;
    reasons.push("Already late");
  }

  if (debt.interestRate) {
    score += debt.interestRate * 2;
    reasons.push(`${debt.interestRate}% interest`);
  }

  if (debt.penaltyAmount && debt.penaltyAfterDate) {
    const days = daysUntil(debt.penaltyAfterDate);
    const penalty = formatCurrency(debt.penaltyAmount);
    if (days < 0) {
      score += 80 + debt.penaltyAmount / 10;
      reasons.push(`${penalty} penalty already applied`);
    } else if (days <= 7) {
      score += 50 - days * 4 + debt.penaltyAmount / 20;
      reasons.push(`${penalty} penalty in ${days} day${days === 1 ? "" : "s"}`);
    }
  }

  return { score, reasons };
}

export function recommendPayOrder(bills: Bill[], debts: Debt[]): PayRecommendation[] {
  const items: PayRecommendation[] = [];

  for (const bill of bills) {
    if (bill.status === "paid") continue;
    const { score, reasons } = scoreBill(bill);
    if (score > 0) {
      items.push({ id: bill.id, kind: "bill", name: bill.name, amount: bill.amount, score, reasons });
    }
  }

  for (const debt of debts) {
    const { score, reasons } = scoreDebt(debt);
    if (score > 0) {
      items.push({ id: debt.id, kind: "debt", name: debt.name, amount: debt.currentBalance, score, reasons });
    }
  }

  return items.sort((a, b) => b.score - a.score);
}
