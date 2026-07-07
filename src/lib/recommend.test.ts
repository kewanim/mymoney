import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { recommendPayOrder } from "./recommend";
import type { Bill, Debt } from "./types";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 7)); // 2026-07-07
});

afterEach(() => {
  vi.useRealTimers();
});

function makeBill(overrides: Partial<Bill>): Bill {
  return {
    id: "bill-1",
    name: "Test Bill",
    amount: 100,
    dueDate: "2026-07-07",
    accountId: "acct-1",
    recurrence: "none",
    autopay: false,
    status: "upcoming",
    ...overrides,
  };
}

function makeDebt(overrides: Partial<Debt>): Debt {
  return {
    id: "debt-1",
    name: "Test Debt",
    currentBalance: 500,
    isLate: false,
    ...overrides,
  };
}

describe("recommendPayOrder", () => {
  it("returns nothing when everything is on track", () => {
    const bill = makeBill({ dueDate: "2026-07-25" });
    const debt = makeDebt({});
    expect(recommendPayOrder([bill], [debt])).toEqual([]);
  });

  it("excludes bills already marked paid", () => {
    const bill = makeBill({ dueDate: "2026-07-01", status: "paid" });
    expect(recommendPayOrder([bill], [])).toEqual([]);
  });

  it("ranks an overdue bill above one due soon", () => {
    const overdue = makeBill({ id: "overdue", dueDate: "2026-07-01" });
    const dueSoon = makeBill({ id: "due-soon", dueDate: "2026-07-09" });
    const result = recommendPayOrder([dueSoon, overdue], []);
    expect(result.map((r) => r.id)).toEqual(["overdue", "due-soon"]);
  });

  it("flags a late debt with an 'Already late' reason", () => {
    const debt = makeDebt({ isLate: true });
    const result = recommendPayOrder([], [debt]);
    expect(result).toHaveLength(1);
    expect(result[0].reasons).toContain("Already late");
  });

  it("weighs a debt with an imminent penalty higher than one further out", () => {
    const soonPenalty = makeDebt({
      id: "soon",
      penaltyAmount: 50,
      penaltyAfterDate: "2026-07-08",
    });
    const farPenalty = makeDebt({
      id: "far",
      penaltyAmount: 50,
      penaltyAfterDate: "2026-07-13",
    });
    const result = recommendPayOrder([], [farPenalty, soonPenalty]);
    expect(result.map((r) => r.id)).toEqual(["soon", "far"]);
  });

  it("ignores a bill that isn't due soon and isn't overdue", () => {
    const bill = makeBill({ dueDate: "2026-08-01" });
    expect(recommendPayOrder([bill], [])).toEqual([]);
  });

  it("ignores a debt with no late flag, no interest, and no penalty", () => {
    const debt = makeDebt({});
    expect(recommendPayOrder([], [debt])).toEqual([]);
  });
});
