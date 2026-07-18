import type { Bill, Debt } from "@/lib/types";
import { displayBillStatus, formatCurrency } from "@/lib/format";

export function ReminderBanner({ bills, debts }: { bills: Bill[]; debts: Debt[] }) {
  const overdueBills = bills.filter((b) => displayBillStatus(b) === "overdue");
  const dueTodayBills = bills.filter((b) => displayBillStatus(b) === "due_today");
  const lateDebts = debts.filter((d) => d.isLate);

  const items = [
    ...overdueBills.map((b) => ({ label: `${b.name} — overdue`, amount: b.amount })),
    ...dueTodayBills.map((b) => ({ label: `${b.name} — due today`, amount: b.amount })),
    ...lateDebts.map((d) => ({ label: `${d.name} — late`, amount: d.currentBalance })),
  ];

  if (items.length === 0) return null;

  const critical = overdueBills.length + lateDebts.length > 0;

  return (
    <div
      className={`rounded-3xl border px-4 py-3 backdrop-blur-2xl ${
        critical ? "border-critical/40 bg-critical-bg" : "border-warn/40 bg-warn-bg"
      }`}
    >
      <p className={`text-sm font-semibold ${critical ? "text-critical" : "text-warn"}`}>
        {items.length} thing{items.length === 1 ? "" : "s"} need your attention
      </p>
      <ul className="mt-1.5 flex flex-col gap-1 text-sm">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1">{item.label}</span>
            <span className="shrink-0 font-mono tabular-nums">{formatCurrency(item.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
