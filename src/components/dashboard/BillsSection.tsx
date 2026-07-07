"use client";

import { useState } from "react";
import type { Account, Bill, BillRecurrence } from "@/lib/types";
import { displayBillStatus, formatCurrency, formatDate, todayIso } from "@/lib/format";
import { Card, SectionHeading, EmptyState, Badge, IconButton, PrimaryButton } from "./ui";

const RECURRENCE_LABEL: Record<BillRecurrence, string> = {
  none: "One-time",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const STATUS_TONE = {
  upcoming: "neutral",
  due_today: "warn",
  overdue: "critical",
  paid: "good",
} as const;

const STATUS_LABEL = {
  upcoming: "Upcoming",
  due_today: "Due today",
  overdue: "Overdue",
  paid: "Paid",
} as const;

export function BillsSection({
  bills,
  accounts,
  onAdd,
  onRemove,
  onTogglePaid,
}: {
  bills: Bill[];
  accounts: Account[];
  onAdd: (input: Omit<Bill, "id" | "status">) => void;
  onRemove: (id: string) => void;
  onTogglePaid: (id: string, paid: boolean) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const sorted = [...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <Card>
      <SectionHeading
        title="Bills"
        count={bills.length}
        action={
          <PrimaryButton type="button" onClick={() => setShowForm((v) => !v)} disabled={accounts.length === 0}>
            {showForm ? "Cancel" : "+ Add"}
          </PrimaryButton>
        }
      />

      {accounts.length === 0 && (
        <p className="mb-4 text-sm text-ink-soft">Add an account first so you can tag bills to it.</p>
      )}

      {showForm && (
        <BillForm
          accounts={accounts}
          onSubmit={(input) => {
            onAdd(input);
            setShowForm(false);
          }}
        />
      )}

      {sorted.length === 0 ? (
        <EmptyState label="No bills yet. Add your first one to see it here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((bill) => {
            const status = displayBillStatus(bill);
            const account = accounts.find((a) => a.id === bill.accountId);
            return (
              <li
                key={bill.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{bill.name}</span>
                    <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                    {bill.autopay && <Badge tone="neutral">Autopay</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-soft">
                    <span>Due {formatDate(bill.dueDate)}</span>
                    {account && <span>· {account.name}</span>}
                    {bill.recurrence !== "none" && <span>· {RECURRENCE_LABEL[bill.recurrence]}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tabular-nums">{formatCurrency(bill.amount)}</span>
                  <label className="flex items-center gap-1 text-xs text-ink-soft">
                    <input
                      type="checkbox"
                      checked={bill.status === "paid"}
                      onChange={(e) => onTogglePaid(bill.id, e.target.checked)}
                    />
                    Paid
                  </label>
                  <IconButton label={`Remove ${bill.name}`} onClick={() => onRemove(bill.id)}>
                    ✕
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function BillForm({
  accounts,
  onSubmit,
}: {
  accounts: Account[];
  onSubmit: (input: Omit<Bill, "id" | "status">) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [recurrence, setRecurrence] = useState<BillRecurrence>("none");
  const [autopay, setAutopay] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !accountId) return;
    onSubmit({
      name: name.trim(),
      amount: Number(amount) || 0,
      dueDate,
      accountId,
      recurrence,
      autopay,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-2 rounded-lg bg-line/30 p-3">
      <Field label="Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rent"
          className="w-32 rounded-md border border-line bg-paper-raised px-2 py-1 text-sm"
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
      <Field label="Due date">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Account">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Repeats">
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as BillRecurrence)}
          className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm"
        >
          {Object.entries(RECURRENCE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
        <input type="checkbox" checked={autopay} onChange={(e) => setAutopay(e.target.checked)} />
        Autopay
      </label>
      <PrimaryButton type="submit">Save</PrimaryButton>
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
