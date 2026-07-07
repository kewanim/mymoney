"use client";

import { useState } from "react";
import type { Account, Bill, BillRecurrence, Debt } from "@/lib/types";
import { todayIso } from "@/lib/format";
import { Card, Badge } from "./ui";

interface ParsedEntry {
  kind: "bill" | "debt";
  name: string;
  amount: number;
  dueDate: string | null;
  recurrence: BillRecurrence | null;
  penaltyAmount: number | null;
  penaltyAfterDate: string | null;
  notes: string | null;
}

export function SmartEntry({
  accounts,
  onAddBill,
  onAddDebt,
}: {
  accounts: Account[];
  onAddBill: (input: Omit<Bill, "id" | "status">) => void;
  onAddDebt: (input: Omit<Debt, "id">) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedEntry | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

  async function handleParse(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't parse that.");
      setParsed(data);
      setAccountId(accounts[0]?.id ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!parsed) return;
    if (parsed.kind === "bill") {
      if (!accountId) return;
      onAddBill({
        name: parsed.name,
        amount: parsed.amount,
        dueDate: parsed.dueDate ?? todayIso(),
        accountId,
        recurrence: parsed.recurrence ?? "none",
        autopay: false,
        ...(parsed.notes ? { notes: parsed.notes } : {}),
      });
    } else {
      onAddDebt({
        name: parsed.name,
        currentBalance: parsed.amount,
        isLate: false,
        ...(parsed.dueDate ? { dueDate: parsed.dueDate } : {}),
        ...(parsed.penaltyAmount != null ? { penaltyAmount: parsed.penaltyAmount } : {}),
        ...(parsed.penaltyAfterDate ? { penaltyAfterDate: parsed.penaltyAfterDate } : {}),
        ...(parsed.notes ? { notes: parsed.notes } : {}),
      });
    }
    setParsed(null);
    setText("");
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Describe a bill or debt</h2>
        <Badge tone="neutral">Powered by Claude</Badge>
      </div>

      {!parsed && (
        <form onSubmit={handleParse} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='e.g. "$150 ticket, due in 14 days, jumps to $200 after"'
            className="flex-1 rounded-md border border-line bg-paper-raised px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="rounded-md bg-teal px-3 py-2 text-sm font-medium text-teal-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Thinking…" : "Parse"}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-critical">{error}</p>}

      {parsed && (
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-line/20 p-3">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{parsed.kind === "bill" ? "Bill" : "Debt"}</Badge>
            <span className="font-medium">{parsed.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Field label="Amount">
              <input
                type="number"
                step="0.01"
                value={parsed.amount}
                onChange={(e) => setParsed({ ...parsed, amount: Number(e.target.value) || 0 })}
                className="w-full rounded-md border border-line bg-paper-raised px-2 py-1 text-sm tabular-nums"
              />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                value={parsed.dueDate ?? ""}
                onChange={(e) => setParsed({ ...parsed, dueDate: e.target.value })}
                className="w-full rounded-md border border-line bg-paper-raised px-2 py-1 text-sm"
              />
            </Field>
            {parsed.kind === "bill" && accounts.length > 0 && (
              <Field label="Account">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-md border border-line bg-paper-raised px-2 py-1 text-sm"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {parsed.kind === "debt" && (parsed.penaltyAmount != null || parsed.penaltyAfterDate != null) && (
              <Field label="Penalty">
                <span className="block py-1">
                  {parsed.penaltyAmount != null ? `$${parsed.penaltyAmount}` : "—"}
                  {parsed.penaltyAfterDate ? ` after ${parsed.penaltyAfterDate}` : ""}
                </span>
              </Field>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={parsed.kind === "bill" && !accountId}
              className="rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-teal-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Looks good — add it
            </button>
            <button
              type="button"
              onClick={() => setParsed(null)}
              className="rounded-md bg-line/60 px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-line"
            >
              Discard
            </button>
          </div>
          {parsed.kind === "bill" && accounts.length === 0 && (
            <p className="text-xs text-ink-soft">Add an account first so this bill has somewhere to tag to.</p>
          )}
        </div>
      )}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
