// Core domain types for MyMoney, per the schema agreed in CLAUDE.md.
// Dates are stored as ISO date strings (e.g. "2026-07-06") for portability
// (JSON/localStorage today, a future Swift/SwiftData port later).

export type AccountType = "checking" | "savings" | "credit_card" | "cash";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currentBalance: number;
  creditLimit?: number;
  interestRate?: number;
}

// Shared by Bill and Income so "every 2 weeks" means the same thing everywhere.
export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly" | "yearly";
export type BillRecurrence = "none" | RecurrenceFrequency;
export type BillStatus = "upcoming" | "due_today" | "overdue" | "paid";

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  accountId: string;
  category?: string;
  recurrence: BillRecurrence;
  autopay: boolean;
  status: BillStatus;
  notes?: string;
}

export interface Debt {
  id: string;
  name: string;
  currentBalance: number;
  originalAmount?: number;
  accountId?: string;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  isLate: boolean;
  penaltyAmount?: number;
  penaltyAfterDate?: string;
  notes?: string;
}

export type IncomeType = "one_time" | "recurring";

export interface Income {
  id: string;
  source: string;
  amount: number;
  type: IncomeType;
  recurrence?: RecurrenceFrequency;
  dateReceived?: string;
  nextExpectedDate?: string;
  notes?: string;
}
