"use client";

import { useState } from "react";
import type { Income, IncomeType, RecurrenceFrequency } from "@/lib/types";
import { formatCurrency, formatDate, todayIso } from "@/lib/format";
import { Card, SectionHeading, EmptyState, Badge, IconButton } from "./ui";

const RECURRENCE_LABEL: Record<RecurrenceFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function IncomeSection({
  income,
  onAdd,
  onRemove,
}: {
  income: Income[];
  onAdd: (input: Omit<Income, "id">) => void;
  onRemove: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const sorted = [...income].sort((a, b) =>
    (a.nextExpectedDate ?? "").localeCompare(b.nextExpectedDate ?? ""),
  );

  return (
    <Card>
      <SectionHeading
        title="Income"
        count={income.length}
        action={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-teal px-3 py-1 text-sm font-medium text-teal-ink hover:opacity-90"
          >
            {showForm ? "Cancel" : "+ Add"}
          </button>
        }
      />

      {showForm && (
        <IncomeForm
          onSubmit={(input) => {
            onAdd(input);
            setShowForm(false);
          }}
        />
      )}

      {sorted.length === 0 ? (
        <EmptyState label="No income logged yet. Add what's expected to sharpen your earning target." />
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{entry.source}</span>
                  <Badge tone="neutral">
                    {entry.type === "recurring" && entry.recurrence
                      ? RECURRENCE_LABEL[entry.recurrence]
                      : "One-time"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-soft">
                  {entry.nextExpectedDate && <span>Next {formatDate(entry.nextExpectedDate)}</span>}
                  {entry.dateReceived && <span>Received {formatDate(entry.dateReceived)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm tabular-nums">{formatCurrency(entry.amount)}</span>
                <IconButton label={`Remove ${entry.source}`} onClick={() => onRemove(entry.id)}>
                  ✕
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function IncomeForm({ onSubmit }: { onSubmit: (input: Omit<Income, "id">) => void }) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<IncomeType>("recurring");
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>("biweekly");
  const [nextExpectedDate, setNextExpectedDate] = useState(todayIso());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!source.trim()) return;
    onSubmit({
      source: source.trim(),
      amount: Number(amount) || 0,
      type,
      ...(type === "recurring" ? { recurrence, nextExpectedDate } : { nextExpectedDate }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-2 rounded-lg bg-line/30 p-3">
      <Field label="Source">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Freelance client"
          className="w-36 rounded-md border border-line bg-paper-raised px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Amount">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-24 rounded-md border border-line bg-paper-raised px-2 py-1 text-sm tabular-nums"
        />
      </Field>
      <Field label="Type">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as IncomeType)}
          className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm"
        >
          <option value="recurring">Recurring</option>
          <option value="one_time">One-time</option>
        </select>
      </Field>
      {type === "recurring" && (
        <Field label="Repeats">
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as RecurrenceFrequency)}
            className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm"
          >
            {Object.entries(RECURRENCE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Next expected">
        <input
          type="date"
          value={nextExpectedDate}
          onChange={(e) => setNextExpectedDate(e.target.value)}
          className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm"
        />
      </Field>
      <button
        type="submit"
        className="rounded-md bg-teal px-3 py-1 text-sm font-medium text-teal-ink hover:opacity-90"
      >
        Save
      </button>
    </form>
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
