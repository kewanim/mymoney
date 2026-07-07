"use client";

import { useState } from "react";
import type { Account, Bill, Debt, Income } from "@/lib/types";
import { calculateIncomeTarget } from "@/lib/incomeTarget";
import { formatCurrency } from "@/lib/format";
import { Card } from "./ui";

const HORIZONS = [7, 14, 30] as const;

export function IncomeTargetSection({
  accounts,
  bills,
  debts,
  income,
}: {
  accounts: Account[];
  bills: Bill[];
  debts: Debt[];
  income: Income[];
}) {
  const [horizonDays, setHorizonDays] = useState<(typeof HORIZONS)[number]>(14);
  const result = calculateIncomeTarget({ accounts, bills, debts, income }, horizonDays);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="shrink-0 text-lg font-semibold tracking-tight text-nowrap">Income target</h2>
        <div className="flex shrink-0 gap-0.5 rounded-full bg-field p-1">
          {HORIZONS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setHorizonDays(days)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                days === horizonDays
                  ? "bg-gradient-to-br from-teal to-violet text-teal-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                  : "text-ink-soft"
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <Stat label="Due" value={formatCurrency(result.totalDue)} />
        <Stat label="On hand" value={formatCurrency(result.availableBalance)} />
        <Stat label="Expected income" value={formatCurrency(result.expectedIncome)} />
      </div>

      {result.gap <= 0 ? (
        <p className="rounded-2xl bg-good-bg px-4 py-3 text-sm text-good">
          You&apos;re covered for the next {horizonDays} days — no extra earning needed.
        </p>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl bg-field px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-ink-soft">Earn at least</p>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {formatCurrency(result.dailyTarget)}
              <span className="text-sm font-normal text-ink-soft"> / day</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-soft">or</p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              {formatCurrency(result.weeklyTarget)}
              <span className="text-sm font-normal text-ink-soft"> / week</span>
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
