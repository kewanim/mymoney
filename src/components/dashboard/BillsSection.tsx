"use client";

import { useState } from "react";
import type { Account, Bill, BillRecurrence } from "@/lib/types";
import { displayBillStatus, formatCurrency, formatDate, todayIso } from "@/lib/format";
import {
  Card,
  SectionHeading,
  EmptyState,
  Badge,
  IconButton,
  PrimaryButton,
  GroupedList,
  GroupedRow,
  Switch,
} from "./ui";

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

type FormMode = { type: "add" } | { type: "edit"; bill: Bill };

export function BillsSection({
  bills,
  accounts,
  onAdd,
  onUpdate,
  onRemove,
  onTogglePaid,
}: {
  bills: Bill[];
  accounts: Account[];
  onAdd: (input: Omit<Bill, "id" | "status">) => void;
  onUpdate: (id: string, updates: Partial<Omit<Bill, "id">>) => void;
  onRemove: (id: string) => void;
  onTogglePaid: (id: string, paid: boolean) => void;
}) {
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const sorted = [...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <Card>
      <SectionHeading
        title="Bills"
        count={bills.length}
        action={
          <PrimaryButton
            type="button"
            onClick={() => setFormMode((m) => (m ? null : { type: "add" }))}
          >
            {formMode ? "Cancel" : "+ Add"}
          </PrimaryButton>
        }
      />

      {formMode && (
        <BillForm
          key={formMode.type === "edit" ? formMode.bill.id : "add"}
          accounts={accounts}
          initial={formMode.type === "edit" ? formMode.bill : undefined}
          onSubmit={(input) => {
            if (formMode.type === "edit") {
              onUpdate(formMode.bill.id, input);
            } else {
              onAdd(input);
            }
            setFormMode(null);
          }}
        />
      )}

      {sorted.length === 0 ? (
        <EmptyState label="No bills yet. Add your first one to see it here." />
      ) : (
        <GroupedList>
          {sorted.map((bill) => {
            const status = displayBillStatus(bill);
            const account = accounts.find((a) => a.id === bill.accountId);
            return (
              <GroupedRow key={bill.id}>
                <button
                  type="button"
                  onClick={() => setFormMode({ type: "edit", bill })}
                  className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium">{bill.name}</span>
                    <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                    {bill.autopay && <Badge tone="neutral">Autopay</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-soft">
                    <span>Due {formatDate(bill.dueDate)}</span>
                    {account && <span>· {account.name}</span>}
                    {bill.recurrence !== "none" && <span>· {RECURRENCE_LABEL[bill.recurrence]}</span>}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-sm tabular-nums">{formatCurrency(bill.amount)}</span>
                  <Switch
                    checked={bill.status === "paid"}
                    onChange={(checked) => onTogglePaid(bill.id, checked)}
                    label={`Mark ${bill.name} paid`}
                  />
                  <IconButton label={`Remove ${bill.name}`} onClick={() => onRemove(bill.id)}>
                    ✕
                  </IconButton>
                </div>
              </GroupedRow>
            );
          })}
        </GroupedList>
      )}
    </Card>
  );
}

function BillForm({
  accounts,
  initial,
  onSubmit,
}: {
  accounts: Account[];
  initial?: Bill;
  onSubmit: (input: Omit<Bill, "id" | "status">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? todayIso());
  const [accountId, setAccountId] = useState(initial?.accountId ?? "");
  const [recurrence, setRecurrence] = useState<BillRecurrence>(initial?.recurrence ?? "none");
  const [autopay, setAutopay] = useState(initial?.autopay ?? false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      amount: Number(amount) || 0,
      dueDate,
      recurrence,
      autopay,
      ...(accountId ? { accountId } : {}),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border border-field-border p-3"
    >
      <Field label="Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rent"
          className="w-32 rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Amount">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-24 rounded-xl border border-field-border bg-field px-2 py-1 text-sm tabular-nums"
        />
      </Field>
      <Field label="Due date">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Account">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
        >
          <option value="">None yet</option>
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
          className="rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
        >
          {Object.entries(RECURRENCE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <div className="mb-1.5 flex items-center gap-2 text-sm text-ink-soft">
        <Switch checked={autopay} onChange={setAutopay} label="Autopay" />
        Autopay
      </div>
      <PrimaryButton type="submit">{initial ? "Save changes" : "Save"}</PrimaryButton>
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
