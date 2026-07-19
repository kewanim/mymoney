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
- **Data persistence:** browser-only storage (localStorage), same pattern as
  GigTax. No backend/bank sync — data lives on-device, moved between devices
  via manual export/import (see Backup below).
- **Auth:** none (single local user per device)
- **Bill vs Debt:** kept as separate models (not unified). Bill = scheduled/
  recurring obligation on a due-date cycle. Debt = balance not on a normal bill
  cycle, or something currently late (old medical bill, personal loan, credit
  card balance).
- **Account:** simplified — manually-entered current balance, no bank
  institution/sync metadata. A credit card's balance means *what's owed on it*
  (a liability) — it's excluded from "cash on hand" math and subtracts from
  the net "across accounts" total, never adds.

## Schema (implemented — see `src/lib/types.ts`)

**Account**
`id, name, type ('checking'|'savings'|'credit_card'|'cash'), currentBalance (manual — for credit cards this is the amount owed, not a positive balance), creditLimit? (cards), interestRate? (cards, APR)`

**Bill** — scheduled/recurring, on a due-date cycle
`id, name, amount, dueDate, accountId (FK), category?, recurrence ('none'|'weekly'|'biweekly'|'monthly'|'yearly'), autopay: bool, status ('upcoming'|'due_today'|'overdue'|'paid'), notes?`

**Debt** — balances not on a normal bill cycle, or things currently behind on
`id, name, currentBalance, originalAmount?, accountId? (FK, optional), interestRate?, minimumPayment?, dueDate?, isLate: bool, penaltyAmount?, penaltyAfterDate?, notes?`

(`penaltyAmount`/`penaltyAfterDate` covers cases like "$150 ticket, jumps to $200
after 14 days.")

**Income**
`id, source, amount, type ('one_time'|'recurring'), recurrence?, dateReceived?, nextExpectedDate?, notes?`

## Shipped features
- Full CRUD dashboard: Overview, Bills, Debts, Accounts, Income tabs, each
  backed by its own localStorage store (`src/lib/storage/`)
- **Pay First** recommendation engine (`src/lib/recommend.ts`) — ranks bills/
  debts by overdue status, penalties, interest rate
- **Income target calculator** (`src/lib/incomeTarget.ts`) — reverse-calculates
  daily/weekly earning target to cover upcoming bills/debts over a 7/14/30-day
  horizon
- **Smart Entry** — natural-language or document (PDF/image/CSV/.xlsx) bill
  entry. Bring-your-own-key: user picks Claude, ChatGPT, or Gemini and pastes
  their own API key (Settings card on Overview, `src/lib/aiSettings.ts`),
  stored only in that browser's localStorage. Server route
  (`src/app/api/parse-entry/route.ts`) dispatches to one of three adapters,
  all normalized to the same output schema. ChatGPT doesn't support inline
  PDF input yet — that combination returns a friendly error.
- **Backup/restore** — export all data as a JSON file, import it on another
  device (`src/lib/backup.ts`), since there's no sync/backend
- **Native iOS app** — wraps the live production site in a Capacitor WebView
  shell (not a static bundle, so the Claude/ChatGPT/Gemini API routes keep
  working). Installed via TestFlight, not the public App Store yet.
  - `capacitor.config.ts` — `server.url` points at the live Vercel deployment
  - `ios/ship-testflight.sh` — one-command build + upload (bumps build number,
    archives, uploads via an App Store Connect API key stored outside the repo
    at `~/.appstoreconnect/private_keys/`, never committed)
  - Most changes (UI, logic, styling) are pure web code — pushing to `main`
    auto-deploys via Vercel and is live in the app on next reload, **no
    TestFlight build needed**. A new TestFlight build is only required when a
    change touches the native shell itself — e.g. the `contentInset` setting
    in `capacitor.config.ts` (needed a rebuild), versus the color-scheme
    simplification or the 16px input font-size fix, both pure CSS (no
    rebuild, just a git push).
- iOS-native visual design: plain white (light) / black (dark) surfaces, one
  flat accent color, frosted glass cards, floating bottom tab bar
  (`src/app/globals.css`, `src/components/dashboard/`)

## What's next
No fixed sprint plan at this point — working iteratively off bug reports and
feature requests while field-testing via TestFlight. Known gaps: Gemini/
ChatGPT adapters haven't been tested end-to-end with real keys (only Claude
has); no App Store public submission yet (TestFlight internal testing only);
GigTax income integration mentioned above is still unscoped.

## Tech stack
Next.js (App Router) + TypeScript + Tailwind CSS v4, deployed on Vercel.
Wrapped as a native iOS app via Capacitor (see above). Architecture should
stay clean enough that data models/business logic could later inform a
native Swift/iOS rebuild if the Capacitor wrapper is ever outgrown (see
GigTax's SwiftUI + SwiftData port as precedent).
