"use client";

import { useState } from "react";
import type { Account, Debt } from "@/lib/types";
import { formatCurrency, formatDate, todayIso } from "@/lib/format";
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

export function DebtsSection({
  debts,
  accounts,
  onAdd,
  onRemove,
  onToggleLate,
}: {
  debts: Debt[];
  accounts: Account[];
  onAdd: (input: Omit<Debt, "id">) => void;
  onRemove: (id: string) => void;
  onToggleLate: (id: string, isLate: boolean) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const sorted = [...debts].sort((a, b) => Number(b.isLate) - Number(a.isLate));

  return (
    <Card>
      <SectionHeading
        title="Debts"
        count={debts.length}
        action={
          <PrimaryButton type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ Add"}
          </PrimaryButton>
        }
      />

      {showForm && (
        <DebtForm
          accounts={accounts}
          onSubmit={(input) => {
            onAdd(input);
            setShowForm(false);
          }}
        />
      )}

      {sorted.length === 0 ? (
        <EmptyState label="No debts on record. Anything overdue or off-cycle goes here." />
      ) : (
        <GroupedList>
          {sorted.map((debt) => {
            const today = todayIso();
            const penaltyHit = debt.penaltyAfterDate && debt.penaltyAfterDate < today;
            return (
              <GroupedRow key={debt.id}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{debt.name}</span>
                    {debt.isLate && <Badge tone="critical">Late</Badge>}
                    {penaltyHit && <Badge tone="warn">Penalty applied</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-soft">
                    {debt.dueDate && <span>Due {formatDate(debt.dueDate)}</span>}
                    {debt.minimumPayment != null && (
                      <span>· Min {formatCurrency(debt.minimumPayment)}</span>
                    )}
                    {debt.interestRate != null && <span>· {debt.interestRate}% APR</span>}
                    {debt.penaltyAmount != null && debt.penaltyAfterDate && (
                      <span>
                        · {formatCurrency(debt.penaltyAmount)} after {formatDate(debt.penaltyAfterDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tabular-nums">
                    {formatCurrency(debt.currentBalance)}
                  </span>
                  <Switch
                    checked={debt.isLate}
                    onChange={(checked) => onToggleLate(debt.id, checked)}
                    label={`Mark ${debt.name} late`}
                  />
                  <IconButton label={`Remove ${debt.name}`} onClick={() => onRemove(debt.id)}>
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

function DebtForm({
  accounts,
  onSubmit,
}: {
  accounts: Account[];
  onSubmit: (input: Omit<Debt, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyAfterDate, setPenaltyAfterDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      currentBalance: Number(currentBalance) || 0,
      isLate,
      ...(accountId ? { accountId } : {}),
      ...(dueDate ? { dueDate } : {}),
      ...(minimumPayment ? { minimumPayment: Number(minimumPayment) } : {}),
      ...(penaltyAmount ? { penaltyAmount: Number(penaltyAmount) } : {}),
      ...(penaltyAfterDate ? { penaltyAfterDate } : {}),
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
          placeholder="Old medical bill"
          className="w-36 rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Balance">
        <input
          type="number"
          step="0.01"
          value={currentBalance}
          onChange={(e) => setCurrentBalance(e.target.value)}
          placeholder="0.00"
          className="w-24 rounded-xl border border-field-border bg-field px-2 py-1 text-sm tabular-nums"
        />
      </Field>
      {accounts.length > 0 && (
        <Field label="Account">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
          >
            <option value="">None</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Due date">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Min. payment">
        <input
          type="number"
          step="0.01"
          value={minimumPayment}
          onChange={(e) => setMinimumPayment(e.target.value)}
          placeholder="0.00"
          className="w-24 rounded-xl border border-field-border bg-field px-2 py-1 text-sm tabular-nums"
        />
      </Field>
      <Field label="Penalty amount">
        <input
          type="number"
          step="0.01"
          value={penaltyAmount}
          onChange={(e) => setPenaltyAmount(e.target.value)}
          placeholder="0.00"
          className="w-24 rounded-xl border border-field-border bg-field px-2 py-1 text-sm tabular-nums"
        />
      </Field>
      <Field label="Penalty after">
        <input
          type="date"
          value={penaltyAfterDate}
          onChange={(e) => setPenaltyAfterDate(e.target.value)}
          className="rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
        />
      </Field>
      <div className="mb-1.5 flex items-center gap-2 text-sm text-ink-soft">
        <Switch checked={isLate} onChange={setIsLate} label="Already late" />
        Already late
      </div>
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
