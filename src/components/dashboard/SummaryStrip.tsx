import type { Account, Bill, Debt } from "@/lib/types";
import { displayBillStatus, formatCurrency, todayIso } from "@/lib/format";

function inNextDays(dateStr: string, days: number): boolean {
  const today = new Date(todayIso());
  const target = new Date(dateStr);
  const diff = (target.getTime() - today.getTime()) / 86_400_000;
  return diff >= 0 && diff <= days;
}

export function SummaryStrip({
  accounts,
  bills,
  debts,
}: {
  accounts: Account[];
  bills: Bill[];
  debts: Debt[];
}) {
  const dueThisWeek = bills.filter(
    (b) => b.status !== "paid" && inNextDays(b.dueDate, 7),
  );
  const dueThisWeekTotal = dueThisWeek.reduce((sum, b) => sum + b.amount, 0);

  const overdueBills = bills.filter((b) => displayBillStatus(b) === "overdue");
  const lateDebts = debts.filter((d) => d.isLate);
  const behindCount = overdueBills.length + lateDebts.length;
  const behindTotal =
    overdueBills.reduce((sum, b) => sum + b.amount, 0) +
    lateDebts.reduce((sum, d) => sum + d.currentBalance, 0);

  // A credit card's balance is what's owed on it, not cash on hand — it
  // subtracts from the net total instead of adding to it.
  const totalBalance = accounts.reduce(
    (sum, a) => sum + (a.type === "credit_card" ? -a.currentBalance : a.currentBalance),
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Tile label="Due this week" value={formatCurrency(dueThisWeekTotal)} sub={`${dueThisWeek.length} bill${dueThisWeek.length === 1 ? "" : "s"}`} />
      <Tile
        label="Behind"
        value={formatCurrency(behindTotal)}
        sub={`${behindCount} item${behindCount === 1 ? "" : "s"}`}
        tone={behindCount > 0 ? "critical" : undefined}
      />
      <Tile label="Across accounts" value={formatCurrency(totalBalance)} sub={`${accounts.length} account${accounts.length === 1 ? "" : "s"}`} />
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "critical";
}) {
  return (
    <div className="glass overflow-hidden rounded-3xl p-4 backdrop-blur-2xl backdrop-saturate-150">
      <p className="font-mono text-2xl font-semibold tabular-nums" style={tone === "critical" ? { color: "var(--critical)" } : undefined}>
        {value}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {label} · {sub}
      </p>
    </div>
  );
}
