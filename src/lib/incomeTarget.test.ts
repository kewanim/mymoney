import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { calculateIncomeTarget } from "./incomeTarget";
import type { Account, Bill, Debt, Income } from "./types";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 7)); // 2026-07-07
});

afterEach(() => {
  vi.useRealTimers();
});

function makeAccount(overrides: Partial<Account>): Account {
  return { id: "acct-1", name: "Checking", type: "checking", currentBalance: 0, ...overrides };
}

function makeBill(overrides: Partial<Bill>): Bill {
  return {
    id: "bill-1",
    name: "Bill",
    amount: 100,
    dueDate: "2026-07-10",
    accountId: "acct-1",
    recurrence: "none",
    autopay: false,
    status: "upcoming",
    ...overrides,
  };
}

function makeDebt(overrides: Partial<Debt>): Debt {
  return { id: "debt-1", name: "Debt", currentBalance: 200, isLate: false, ...overrides };
}

function makeIncome(overrides: Partial<Income>): Income {
  return { id: "income-1", source: "Job", amount: 100, type: "recurring", ...overrides };
}

describe("calculateIncomeTarget", () => {
  it("has no gap when on-hand balance covers what's due", () => {
    const accounts = [makeAccount({ currentBalance: 500 })];
    const bills = [makeBill({ amount: 100 })];
    const result = calculateIncomeTarget({ accounts, bills, debts: [], income: [] }, 14);
    expect(result.totalDue).toBe(100);
    expect(result.gap).toBe(0);
    expect(result.dailyTarget).toBe(0);
  });

  it("computes a daily and weekly target when short", () => {
    const accounts = [makeAccount({ currentBalance: 0 })];
    const bills = [makeBill({ amount: 140 })];
    const result = calculateIncomeTarget({ accounts, bills, debts: [], income: [] }, 14);
    expect(result.gap).toBe(140);
    expect(result.dailyTarget).toBe(10);
    expect(result.weeklyTarget).toBe(70);
  });

  it("does not count a credit card balance as available cash", () => {
    const accounts = [
      makeAccount({ id: "checking", type: "checking", currentBalance: 50 }),
      makeAccount({ id: "card", type: "credit_card", currentBalance: 1000 }),
    ];
    const result = calculateIncomeTarget({ accounts, bills: [], debts: [], income: [] }, 14);
    expect(result.availableBalance).toBe(50);
  });

  it("includes a late debt's minimum payment regardless of horizon", () => {
    const debts = [makeDebt({ isLate: true, minimumPayment: 30, dueDate: undefined })];
    const result = calculateIncomeTarget({ accounts: [], bills: [], debts, income: [] }, 7);
    expect(result.totalDue).toBe(30);
  });

  it("excludes a non-late debt whose due date falls outside the horizon", () => {
    const debts = [makeDebt({ isLate: false, dueDate: "2026-08-15" })];
    const result = calculateIncomeTarget({ accounts: [], bills: [], debts, income: [] }, 14);
    expect(result.totalDue).toBe(0);
  });

  it("offsets the gap with income expected inside the horizon", () => {
    const accounts = [makeAccount({ currentBalance: 0 })];
    const bills = [makeBill({ amount: 200 })];
    const income = [makeIncome({ amount: 150, nextExpectedDate: "2026-07-09" })];
    const result = calculateIncomeTarget({ accounts, bills, debts: [], income }, 14);
    expect(result.expectedIncome).toBe(150);
    expect(result.gap).toBe(50);
  });

  it("ignores income expected after the horizon", () => {
    const income = [makeIncome({ amount: 150, nextExpectedDate: "2026-09-01" })];
    const result = calculateIncomeTarget({ accounts: [], bills: [], debts: [], income }, 14);
    expect(result.expectedIncome).toBe(0);
  });
});
