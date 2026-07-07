import type { Bill, Debt } from "@/lib/types";
import { recommendPayOrder } from "@/lib/recommend";
import { formatCurrency } from "@/lib/format";
import { Card, SectionHeading, EmptyState, Badge } from "./ui";

export function PayFirstSection({ bills, debts }: { bills: Bill[]; debts: Debt[] }) {
  const recommendations = recommendPayOrder(bills, debts);

  return (
    <Card>
      <SectionHeading title="Pay this first" count={recommendations.length} action={null} />

      {recommendations.length === 0 ? (
        <EmptyState label="Nothing urgent right now — everything's on track." />
      ) : (
        <ol className="divide-field-border divide-y overflow-hidden rounded-2xl bg-field">
          {recommendations.map((item, index) => (
            <li
              key={`${item.kind}-${item.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-violet font-mono text-xs font-semibold text-teal-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge tone="neutral">{item.kind === "bill" ? "Bill" : "Debt"}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
                    {item.reasons.map((reason) => (
                      <span key={reason}>{reason}</span>
                    ))}
                  </div>
                </div>
              </div>
              <span className="font-mono text-sm tabular-nums">{formatCurrency(item.amount)}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
