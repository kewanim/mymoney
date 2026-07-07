import type { Bill, BillStatus } from "@/lib/types";

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function todayIso(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function daysUntil(dateStr: string): number {
  const today = new Date(todayIso());
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function displayBillStatus(bill: Pick<Bill, "status" | "dueDate">): BillStatus {
  if (bill.status === "paid") return "paid";
  const today = todayIso();
  if (bill.dueDate < today) return "overdue";
  if (bill.dueDate === today) return "due_today";
  return "upcoming";
}
