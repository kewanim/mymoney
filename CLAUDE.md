@AGENTS.md

# MyMoney

Personal bill/debt tracking and cash flow app for Kewani. Separate app from GigTax
(gig worker tax tracker) — do not merge codebases or share data models. A future
integration may pull income totals from GigTax as a data source, but that is not
scoped yet.

GitHub: https://github.com/kewanim/mymoney (private)

## Concept
- Log all bills, due dates, and which account/credit card they draw from
- Track debts currently late, separate from scheduled bills
- Single dashboard showing everything at a glance
- Recommendation engine: which bill/debt to pay first when behind (weighting
  factors: overdue status, penalties, interest rate — not yet designed)
- Income target calculator: reverse-calculate daily/weekly earning target needed
  to stay on top of upcoming bills/debts

## Decisions made so far
- **Repo:** private, under kewanim
- **Data persistence (Sprint 1):** browser-only storage (localStorage/IndexedDB),
  same pattern as GigTax. No backend/bank sync yet.
- **Auth:** none for Sprint 1 (single local user)
- **Bill vs Debt:** kept as separate models (not unified). Bill = scheduled/
  recurring obligation on a due-date cycle. Debt = balance not on a normal bill
  cycle, or something currently late (old medical bill, personal loan, credit
  card balance).
- **Account:** simplified — manually-entered current balance, no bank
  institution/sync metadata.
- **Claude API natural-language bill entry** (e.g. "$150 ticket, due in 14 days,
  jumps to $200 after") is a later roadmap item, not Sprint 1 — flagged as a stub.

## Schema (agreed, not yet implemented in code)

**Account**
`id, name, type ('checking'|'savings'|'credit_card'|'cash'), currentBalance (manual), creditLimit? (cards), interestRate? (cards, APR)`

**Bill** — scheduled/recurring, on a due-date cycle
`id, name, amount, dueDate, accountId (FK), category?, recurrence ('none'|'weekly'|'biweekly'|'monthly'|'yearly'), autopay: bool, status ('upcoming'|'due_today'|'overdue'|'paid'), notes?`

**Debt** — balances not on a normal bill cycle, or things currently behind on
`id, name, currentBalance, originalAmount?, accountId? (FK, optional), interestRate?, minimumPayment?, dueDate?, isLate: bool, penaltyAmount?, penaltyAfterDate?, notes?`

(`penaltyAmount`/`penaltyAfterDate` covers cases like "$150 ticket, jumps to $200
after 14 days.")

**Income**
`id, source, amount, type ('one_time'|'recurring'), recurrence?, dateReceived?, nextExpectedDate?, notes?`

## Sprint plan (2-week sprints)
1. **Foundation** (current) — project setup done, schema agreed. Next: write
   TypeScript types + localStorage CRUD for Account/Bill/Debt/Income.
2. Dashboard: main view showing bills, due dates, late debts, account tags
3. Recommendation engine: prioritize which bill/debt to attack first
4. Income target calculator: reverse calculation of daily/weekly earning targets
5. Polish, testing, bug fixes — daily-driver ready
6. (Later) Claude API integration for natural-language bill entry + in-app Q&A

## Tech stack
Next.js (App Router) + TypeScript + Tailwind CSS. Architecture should stay clean
enough that data models/business logic could later inform a native Swift/iOS
rebuild (see GigTax's SwiftUI + SwiftData port as precedent).
