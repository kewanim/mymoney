"use client";

import { useState } from "react";
import type { Account, Bill, BillRecurrence, Debt } from "@/lib/types";
import { todayIso } from "@/lib/format";
import { useAISettings, PROVIDER_LABEL } from "@/lib/aiSettings";
import { Card, Badge, PrimaryButton } from "./ui";

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

type Mode = "describe" | "upload";

export function SmartEntry({
  accounts,
  onAddBill,
  onAddDebt,
}: {
  accounts: Account[];
  onAddBill: (input: Omit<Bill, "id" | "status">) => void;
  onAddDebt: (input: Omit<Debt, "id">) => void;
}) {
  const [mode, setMode] = useState<Mode>("describe");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [accountByIndex, setAccountByIndex] = useState<Record<number, string>>({});
  const aiSettings = useAISettings();
  const providerLabel = PROVIDER_LABEL[aiSettings.provider];
  const apiKey = aiSettings.apiKeys[aiSettings.provider] ?? "";

  async function submitForm(formData: FormData) {
    formData.set("provider", aiSettings.provider);
    formData.set("apiKey", apiKey);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-entry", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't parse that.");
      const parsedEntries: ParsedEntry[] = data.entries ?? [];
      if (parsedEntries.length === 0) {
        setError("Didn't find anything billable in there.");
        return;
      }
      setEntries(parsedEntries);
      setAccountByIndex(
        Object.fromEntries(parsedEntries.map((_, i) => [i, accounts[0]?.id ?? ""])),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleDescribeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const formData = new FormData();
    formData.set("text", text);
    submitForm(formData);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("That file is too big — keep it under 8MB.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    submitForm(formData);
  }

  function updateEntry(index: number, patch: Partial<ParsedEntry>) {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function addEntry(index: number) {
    const entry = entries[index];
    if (entry.kind === "bill") {
      const accountId = accountByIndex[index];
      onAddBill({
        name: entry.name,
        amount: entry.amount,
        dueDate: entry.dueDate ?? todayIso(),
        recurrence: entry.recurrence ?? "none",
        autopay: false,
        ...(accountId ? { accountId } : {}),
        ...(entry.notes ? { notes: entry.notes } : {}),
      });
    } else {
      onAddDebt({
        name: entry.name,
        currentBalance: entry.amount,
        isLate: false,
        ...(entry.dueDate ? { dueDate: entry.dueDate } : {}),
        ...(entry.penaltyAmount != null ? { penaltyAmount: entry.penaltyAmount } : {}),
        ...(entry.penaltyAfterDate ? { penaltyAfterDate: entry.penaltyAfterDate } : {}),
        ...(entry.notes ? { notes: entry.notes } : {}),
      });
    }
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function addAll() {
    // Add from the end so index-based removal doesn't shift pending indexes.
    for (let i = entries.length - 1; i >= 0; i--) {
      addEntry(i);
    }
  }

  function discardAll() {
    setEntries([]);
    setText("");
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex shrink-0 items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-nowrap">
            Add with {providerLabel}
          </h2>
          <Badge tone="accent">Powered by {providerLabel}</Badge>
        </div>
        {entries.length === 0 && apiKey && (
          <div className="flex shrink-0 gap-0.5 rounded-full bg-field p-1">
            <ModeButton active={mode === "describe"} onClick={() => setMode("describe")}>
              Describe
            </ModeButton>
            <ModeButton active={mode === "upload"} onClick={() => setMode("upload")}>
              Upload
            </ModeButton>
          </div>
        )}
      </div>

      {entries.length === 0 && !apiKey && (
        <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">
          Add your {providerLabel} API key below to use Smart Entry.
        </p>
      )}

      {entries.length === 0 && apiKey && mode === "describe" && (
        <form onSubmit={handleDescribeSubmit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='e.g. "$150 ticket, due in 14 days, jumps to $200 after"'
            className="flex-1 rounded-xl border border-field-border bg-field px-3 py-2 text-sm"
          />
          <PrimaryButton type="submit" disabled={loading || !text.trim()}>
            {loading ? "Thinking…" : "Parse"}
          </PrimaryButton>
        </form>
      )}

      {entries.length === 0 && apiKey && mode === "upload" && (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-ink-soft">
            A PDF, spreadsheet (.xlsx), CSV/text export, or a screenshot of a bill —{" "}
            {providerLabel} will pull out whatever it can find.
          </label>
          <input
            type="file"
            accept=".pdf,.csv,.txt,.xlsx,image/*"
            disabled={loading}
            onChange={handleFileChange}
            className="text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-gradient-to-br file:from-teal file:to-violet file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-teal-ink"
          />
          {loading && <p className="text-sm text-ink-soft">Reading the file…</p>}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-critical">{error}</p>}

      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            {entries.map((entry, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-2xl border border-field-border bg-field p-3"
              >
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{entry.kind === "bill" ? "Bill" : "Debt"}</Badge>
                  <span className="font-medium">{entry.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Field label="Amount">
                    <input
                      type="number"
                      step="0.01"
                      value={entry.amount}
                      onChange={(e) => updateEntry(index, { amount: Number(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-field-border bg-field px-2 py-1 text-sm tabular-nums"
                    />
                  </Field>
                  <Field label="Due date">
                    <input
                      type="date"
                      value={entry.dueDate ?? ""}
                      onChange={(e) => updateEntry(index, { dueDate: e.target.value })}
                      className="w-full rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
                    />
                  </Field>
                  {entry.kind === "bill" && accounts.length > 0 && (
                    <Field label="Account">
                      <select
                        value={accountByIndex[index] ?? ""}
                        onChange={(e) =>
                          setAccountByIndex((prev) => ({ ...prev, [index]: e.target.value }))
                        }
                        className="w-full rounded-xl border border-field-border bg-field px-2 py-1 text-sm"
                      >
                        <option value="">None yet</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  {entry.kind === "debt" &&
                    (entry.penaltyAmount != null || entry.penaltyAfterDate != null) && (
                      <Field label="Penalty">
                        <span className="block py-1">
                          {entry.penaltyAmount != null ? `$${entry.penaltyAmount}` : "—"}
                          {entry.penaltyAfterDate ? ` after ${entry.penaltyAfterDate}` : ""}
                        </span>
                      </Field>
                    )}
                </div>
                <div className="flex gap-2">
                  <PrimaryButton type="button" onClick={() => addEntry(index)}>
                    Add
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={() => setEntries((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-full bg-field px-4 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {entries.length > 1 && (
              <PrimaryButton type="button" onClick={addAll}>
                Add all {entries.length}
              </PrimaryButton>
            )}
            <button
              type="button"
              onClick={discardAll}
              className="rounded-full bg-field px-4 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              Discard all
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-gradient-to-r from-teal to-violet text-teal-ink" : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
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
