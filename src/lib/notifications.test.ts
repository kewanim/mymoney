import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { computeReminders } from "./notifications";
import type { Bill, Debt } from "./types";
import type { ReminderSettings } from "./reminderSettings";

// Wednesday 2026-07-08, 10:00am — a time after 9am so "due today at 9am"
// reminders can be tested as both already-past and still-upcoming.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 8, 10, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

const settings: ReminderSettings = { enabled: true, daysBefore: 2 };

function makeBill(overrides: Partial<Bill>): Bill {
  return {
    id: "bill-1",
    name: "Rent",
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
  return { id: "debt-1", name: "Old bill", currentBalance: 200, isLate: false, ...overrides };
}

describe("computeReminders", () => {
  it("returns nothing when reminders are disabled", () => {
    const bills = [makeBill({})];
    expect(computeReminders(bills, [], { ...settings, enabled: false })).toEqual([]);
  });

  it("schedules a due-today and a days-before reminder for an upcoming bill", () => {
    // due 4 days out, so the "2 days before" reminder (2026-07-10 9am) is
    // still ahead of the fixed system time (2026-07-08 10am)
    const bills = [makeBill({ dueDate: "2026-07-12" })];
    const result = computeReminders(bills, [], settings);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Rent is due today");
    expect(result[0].schedule.at).toEqual(new Date(2026, 6, 12, 9, 0, 0));
    expect(result[1].title).toBe("Rent due in 2 days");
    expect(result[1].schedule.at).toEqual(new Date(2026, 6, 10, 9, 0, 0));
  });

  it("skips the days-before reminder when daysBefore is 0", () => {
    const bills = [makeBill({ dueDate: "2026-07-12" })];
    const result = computeReminders(bills, [], { ...settings, daysBefore: 0 });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Rent is due today");
  });

  it("skips a days-before reminder whose target time has already passed", () => {
    // due in exactly 2 days means the reminder would target today 9am,
    // which is behind the fixed system time (2026-07-08 10am)
    const bills = [makeBill({ dueDate: "2026-07-10" })];
    const result = computeReminders(bills, [], settings);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Rent is due today");
  });

  it("skips a due-today reminder once 9am has already passed", () => {
    // system time is 2026-07-08 10:00am, so a bill due today has already
    // missed its 9am reminder window
    const bills = [makeBill({ dueDate: "2026-07-08", status: "due_today" })];
    expect(computeReminders(bills, [], settings)).toEqual([]);
  });

  it("schedules an overdue reminder for tomorrow 9am once today's 9am has passed", () => {
    const bills = [makeBill({ dueDate: "2026-07-01", status: "upcoming" })];
    const result = computeReminders(bills, [], settings);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Rent is overdue");
    expect(result[0].schedule.at).toEqual(new Date(2026, 6, 9, 9, 0, 0));
  });

  it("ignores paid and autopay bills", () => {
    const bills = [
      makeBill({ status: "paid" }),
      makeBill({ id: "bill-2", autopay: true }),
    ];
    expect(computeReminders(bills, [], settings)).toEqual([]);
  });

  it("schedules a single 'is late' reminder for a late debt", () => {
    const debts = [makeDebt({ isLate: true })];
    const result = computeReminders([], debts, settings);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Old bill is late");
  });

  it("schedules due-today and days-before reminders for a debt with a future due date", () => {
    const debts = [makeDebt({ isLate: false, dueDate: "2026-07-12" })];
    const result = computeReminders([], debts, settings);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Old bill is due today");
    expect(result[1].title).toBe("Old bill due in 2 days");
  });

  it("skips a debt with no due date and not marked late", () => {
    const debts = [makeDebt({ isLate: false, dueDate: undefined })];
    expect(computeReminders([], debts, settings)).toEqual([]);
  });
});
