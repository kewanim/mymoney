"use client";

import { useState } from "react";
import type { Account, AccountType } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import {
  Card,
  SectionHeading,
  EmptyState,
  Badge,
  IconButton,
  PrimaryButton,
  GroupedList,
  GroupedRow,
} from "./ui";

const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  cash: "Cash",
};

export function AccountsSection({
  accounts,
  onAdd,
  onRemove,
}: {
  accounts: Account[];
  onAdd: (input: Omit<Account, "id">) => void;
  onRemove: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <SectionHeading
        title="Accounts"
        count={accounts.length}
        action={
          <PrimaryButton type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ Add"}
          </PrimaryButton>
        }
      />

      {showForm && (
        <AccountForm
          onSubmit={(input) => {
            onAdd(input);
            setShowForm(false);
          }}
        />
      )}

      {accounts.length === 0 ? (
        <EmptyState label="No accounts yet. Add one to tag your bills and debts." />
      ) : (
        <GroupedList>
          {accounts.map((account) => (
            <GroupedRow key={account.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{account.name}</span>
                <Badge tone="neutral">{ACCOUNT_TYPE_LABEL[account.type]}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm tabular-nums">
                  {formatCurrency(account.currentBalance)}
                </span>
                <IconButton label={`Remove ${account.name}`} onClick={() => onRemove(account.id)}>
                  ✕
                </IconButton>
              </div>
            </GroupedRow>
          ))}
        </GroupedList>
      )}
    </Card>
  );
}

function AccountForm({ onSubmit }: { onSubmit: (input: Omit<Account, "id">) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [currentBalance, setCurrentBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [interestRate, setInterestRate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type,
      currentBalance: Number(currentBalance) || 0,
      ...(type === "credit_card" && creditLimit ? { creditLimit: Number(creditLimit) } : {}),
      ...(type === "credit_card" && interestRate ? { interestRate: Number(interestRate) } : {}),
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
          placeholder="Chase Checking"
          className="w-36 rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Type">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          className="rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
        >
          {Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Balance">
        <input
          type="number"
          step="0.01"
          value={currentBalance}
          onChange={(e) => setCurrentBalance(e.target.value)}
          placeholder="0.00"
          className="w-28 rounded-xl border border-field-border bg-field px-2 py-1 text-sm tabular-nums"
        />
      </Field>
      {type === "credit_card" && (
        <>
          <Field label="Credit limit">
            <input
              type="number"
              step="0.01"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0.00"
              className="w-28 rounded-xl border border-field-border bg-field px-2 py-1 text-sm tabular-nums"
            />
          </Field>
          <Field label="APR %">
            <input
              type="number"
              step="0.01"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="0.00"
              className="w-20 rounded-xl border border-field-border bg-field px-2 py-1 text-sm tabular-nums"
            />
          </Field>
        </>
      )}
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
