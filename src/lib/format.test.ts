import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { daysUntil, displayBillStatus, formatCurrency, formatDate, todayIso } from "./format";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 7)); // 2026-07-07
});

afterEach(() => {
  vi.useRealTimers();
});

describe("formatCurrency", () => {
  it("formats a positive amount as USD", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("todayIso / daysUntil", () => {
  it("returns today as an ISO date string", () => {
    expect(todayIso()).toBe("2026-07-07");
  });

  it("counts days into the future as positive", () => {
    expect(daysUntil("2026-07-10")).toBe(3);
  });

  it("counts days in the past as negative", () => {
    expect(daysUntil("2026-07-01")).toBe(-6);
  });

  it("is zero for today", () => {
    expect(daysUntil("2026-07-07")).toBe(0);
  });
});

describe("formatDate", () => {
  it("renders a short month/day", () => {
    expect(formatDate("2026-12-25")).toBe("Dec 25");
  });
});

describe("displayBillStatus", () => {
  it("is paid when status is paid, regardless of due date", () => {
    expect(displayBillStatus({ status: "paid", dueDate: "2026-01-01" })).toBe("paid");
  });

  it("is overdue when due date has passed and unpaid", () => {
    expect(displayBillStatus({ status: "upcoming", dueDate: "2026-07-01" })).toBe("overdue");
  });

  it("is due_today when due date is today", () => {
    expect(displayBillStatus({ status: "upcoming", dueDate: "2026-07-07" })).toBe("due_today");
  });

  it("is upcoming when due date is in the future", () => {
    expect(displayBillStatus({ status: "upcoming", dueDate: "2026-07-20" })).toBe("upcoming");
  });
});
