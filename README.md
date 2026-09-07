# Hostinger Rewards App

A deposit/reward/referral platform built specifically for **Hostinger Node.js hosting** with
**MySQL/MariaDB** - no Docker, VPS, or external hosting/database services required.

## Status

**Phase 1 (Node.js project) + Phase 2 (MySQL database) + Phase 3 (Authentication) + Phase 4
(Wallet + transaction ledger) + Phase 5 (Five plans) + Phase 6 (Deposit system) + Phase 7
(Withdrawal + 14-day rule) + Phase 8 (Referral system) + Phase 9 (Reward engine) + Phase 10
(Hostinger Cron) + Phase 11 (Admin API) + Phase 12 (User frontend) + Phase 13 (Admin frontend) +
Phase 14 (Security) + Phase 15 (Testing) complete. Phase 16 (final Hostinger deployment pass)
remains - the deployment docs have been kept current throughout, but an actual end-to-end deploy
to a live Hostinger account has not been performed.**

Implemented so far:

- Express server with a health-check endpoint
- MySQL connection pool (`mysql2`) configured entirely from environment variables
- Full database schema (`database/schema.sql`) and seed data (`database/seed.sql`)
- Centralized error handling (JSON error format, no stack traces)
- Registration, login (both phone-based, no email), logout, password change, and password reset
  (link sent via SMS, or logged to the console if no SMS gateway is configured yet)
- Passwords hashed with bcryptjs (pure JS - no native build step needed on Hostinger)
- Stateless JWT sessions in an httpOnly cookie; logout/password change/reset immediately
  invalidate any previously issued tokens via a `token_version` check
- Per-user wallet row created atomically with registration (single DB transaction)
- Rate limiting on register/login/password-reset-request
- Deployment docs for Hostinger

- `WalletService` (`backend/src/services/wallet.service.js`): the shared primitive every future
  balance-changing feature (deposits, rewards, referral commissions, withdrawals, admin
  adjustments) will call. Every write locks the wallet row, is wrapped in the caller's DB
  transaction, is idempotent via a unique `reference`, refuses to let any balance go negative,
  and always writes an immutable `wallet_transactions` ledger row alongside the balance update.
  Includes a `reverseTransaction` helper for corrections (per PMD section 11 - financial records
  are never deleted, only reversed/adjusted).
- Money math uses `decimal.js` throughout instead of native JS numbers.

### Auth endpoints

```
POST /api/auth/register              { fullName, phone, password, referralCode? }
POST /api/auth/login                 { phone, password }
POST /api/auth/logout                (requires session cookie)
GET  /api/auth/me                    (requires session cookie)
POST /api/auth/password/change       { currentPassword, newPassword } (requires session cookie)
POST /api/auth/password/reset/request { phone }
POST /api/auth/password/reset/confirm { token, newPassword }
```

### Wallet endpoints

```
GET /api/wallet                      (requires session cookie) -> current balances
GET /api/transactions?type=&status=&page=&pageSize=  (requires session cookie) -> paginated ledger
```

A freshly registered user will show a zero-balance wallet and an empty transaction list until a
deposit is approved, a reward is paid, etc. (see the phases below, all of which now call into
`WalletService`).

### Plans endpoint

```
GET /api/plans   (public) -> the 5 seeded plans, ACTIVE ones only, ordered by min_amount
```

`PlanService.validateDepositAmount(plan, amount)` is also in place for Phase 6 to call when a
user picks a plan and amount. Admin plan management (create/edit/disable a plan) is deliberately
deferred to Phase 11 (Admin API), where it lands alongside the other admin endpoints and their
audit logging, rather than being bolted on early with no audit trail.

### Deposit endpoints

```
POST /api/deposits                    { planId, amount, paymentMethod, transactionReference? }
POST /api/deposits/:id/reference      { transactionReference }
GET  /api/deposits?status=&page=&pageSize=
GET  /api/deposits/:id
```

(all require the session cookie). `POST /api/deposits/:id/reference` is not in the PMD's base
API list, but the deposit flow it describes (section 15) is inherently two steps - create the
request, then submit the transaction reference after paying - so a dedicated endpoint for the
second step was added, matching the pattern already used for `GET /api/auth/me`.

- **`PaymentService`** (`backend/src/services/payment/`): a `JazzCashService`/`EasypaisaService`
  abstraction per PMD section 17/18. Both are manual-verification-only for now -
  `getPaymentInstructions()` returns whatever receiving account an admin has configured via env
  vars (or a "not configured yet" message if not), and `verifyPayment()` always returns
  `{ verified: false }` as a placeholder for a future official merchant API integration. No
  payment response is ever fabricated, and nothing here can auto-approve a deposit.
- **`DepositService`**: `createDeposit`, `submitTransactionReference`, `getUserDeposits`,
  `getUserDepositById` are wired to the routes above. `approveDeposit`/`rejectDeposit` are also
  implemented (approving atomically updates the deposit, credits the wallet via `WalletService`,
  and activates a `user_plans` row - all in one DB transaction, per PMD section 32) but have no
  route yet - admin routes/authorization/audit logging land together in Phase 11, same reasoning
  as Phase 5's deferred plan admin endpoints.
- Deposit creation and reference submission are rate-limited (PMD section 52).

### Withdrawal endpoints

```
POST /api/withdrawals                 { amount, paymentMethod, accountName, accountNumber }
GET  /api/withdrawals?status=&page=&pageSize=
GET  /api/withdrawals/:id
```

(all require the session cookie). `SettingsService` (`backend/src/services/settings.service.js`)
is new this phase - the first code to actually read `app_settings`, so every rule below is
database-driven, not hard-coded, and admin can change it later (Phase 11):

- **14-day account age rule** (`withdrawal_min_account_age_days`, default 14): computed from the
  user's own `created_at` (already loaded fresh per request by the auth middleware), enforced
  server-side regardless of what a client sends.
- **Amount bounds** (`minimum_withdrawal` / `maximum_withdrawal`, defaults 500 / 25000).
- **No conflicting withdrawal**: a user can't open a second request while a PENDING/PROCESSING
  one exists.
- **Funds are reserved at request time, not at payout time**: creating a withdrawal immediately
  debits `withdrawable_balance` via `WalletService.debitWithdrawal` in the same DB transaction as
  the insert (PMD section 21 - "reserve/deduct the amount atomically to prevent double
  withdrawal"). The balance check itself happens inside that atomic, row-locked debit rather than
  as a separate pre-check, closing the race window a check-then-write would leave open.
- `WithdrawalService.approveWithdrawal` / `markProcessing` / `markPaid` / `rejectWithdrawal` are
  implemented (rejecting calls `WalletService.reverseTransaction` to refund the reservation) but
  have no route yet - same deferral to Phase 11 as deposit/plan admin actions, so audit logging
  is added once, consistently, across all admin mutations.
- Withdrawal creation is rate-limited (PMD section 52).

Not implemented yet (later phases): reward engine, cron job, admin/user frontend, payment gateway
integration. A "cancel my own pending withdrawal" user action was not added - the PMD's admin
action list (section 33) and user withdrawal page (section 38) don't call for one, though it
would be a small addition (same refund path as reject) if wanted later.

### Referral endpoints

```
GET /api/referrals?page=&pageSize=   -> paginated list of users you referred
GET /api/referrals/stats             -> referralCode, referralLink, totalReferrals,
                                         qualifiedReferrals, referralThreshold,
                                         achievementQualified, bonusEnabled, totalReferralEarnings
```

(both require the session cookie).

- Registration (Phase 3) now actually creates the `referrals` row when a valid referral code is
  used - Phase 3 deliberately left this until this phase so it could be built alongside the
  qualification/commission logic that gives it meaning.
- **Qualifying event**: a referred user's first *approved* deposit. `ReferralService` hooks into
  `DepositService.approveDeposit` (same DB transaction) and:
  - credits the referrer `referral_commission_rate`% (default 10%, from `app_settings`) of the
    deposit amount via `WalletService.creditReferralCommission`, idempotent per deposit
    (`REFCOMM-{walletTransactionId}` reference, and a `(source_transaction_id, commission_type)`
    unique constraint at the DB level too);
  - flips that referral's status from `NOT_QUALIFIED` to `QUALIFIED` the first time this happens.
  - Every later approved deposit from the same referred user still pays commission - only the
    status flip is a one-time transition.
- **Five-referral bonus** (section 26): if `bonus_enabled` and the referrer's qualified-referral
  count is `>= referral_threshold` (default 5), `bonus_commission_rate` is added to the
  commission rate for that calculation. It's recomputed fresh on every commission event (no
  stored "bonus activated" flag needed) - so it applies automatically the moment a referrer
  crosses the threshold, with no admin action required beyond having enabled the bonus.
- `bonus_reward_multiplier` (the reward-side half of the same bonus) is intentionally not used
  yet - it belongs to the daily reward calculation, which is Phase 9.
- Referral `ACTIVE`/`SUSPENDED` statuses exist in the schema but are not set by anything yet -
  no described flow in sections 24-26 defines what triggers them (a plausible option, mirroring
  the referred user's own account status when admin suspends them, is admin-action territory for
  Phase 11, not invented here).

### Reward engine

No new endpoint this phase - PMD section 22 asks specifically for a `RewardService`, and the
endpoint that triggers it (`/api/internal/jobs/process-daily-rewards`, protected by a cron
secret) is explicitly Phase 10's job. So this phase is the engine only:

- **`RewardService.processDailyRewards(referenceDate)`** (`backend/src/services/reward.service.js`)
  is the single entry point Phase 10 will call. For every `ACTIVE` `user_plans` row whose plan's
  `reward_frequency` says today is a reward day (DAILY = every day; WEEKLY/MONTHLY = every 7/30
  days from `started_at`), it credits `eligible_amount * plan.reward_rate / 100` to the user via
  `WalletService.creditReward`, in its own short transaction per user_plan (so one bad row can't
  roll back everyone else's reward for the day).
- **No compounding** (PMD section 23): `eligible_amount` is always the original `user_plans.amount`
  principal, never the running wallet or reward balance - so yesterday's reward never becomes
  today's extra principal. There's no admin setting to turn compounding on; the PMD frames that as
  a possible future addition, not a current requirement.
- **Idempotent by design**: each user_plan/date is checked against `reward_ledger` before crediting,
  and the table's own `(user_id, user_plan_id, reward_date)` unique constraint is the backstop if
  two runs ever race - running `processDailyRewards` twice for the same day credits nothing twice.
- A disabled plan (admin sets `plans.status = 'INACTIVE'`) doesn't stop its existing investors from
  earning - only a user_plan's own status matters here, not the current plan status. That's a
  reading of "disable a plan" as "stop new signups," not "stop honoring existing commitments";
  worth confirming that's the intended behavior.
- Reward history isn't exposed as its own endpoint - PMD section 40 already routes reward viewing
  through `GET /api/transactions?type=REWARD` (built in Phase 4), which now actually has data to
  show. `reward_ledger` itself is the audit/duplicate-prevention table Phase 11's `/admin/rewards`
  page will read from.

### Hostinger Cron trigger

```
POST /api/internal/jobs/process-daily-rewards
Authorization: Bearer <CRON_SECRET>
Body (optional): { "date": "YYYY-MM-DD" }   -- defaults to today; useful for manual backfill/testing
```

- Protected by `CRON_SECRET` (now a required env var, like `JWT_SECRET`) via
  `middleware/verifyCronSecret.js`, compared with `crypto.timingSafeEqual` rather than `===`.
  There is no user session involved - this is server-to-server, called by Hostinger Cron.
  Also rate-limited (PMD section 52 explicitly calls out "internal cron endpoint").
- `backend/src/jobs/dailyRewardJob.js` is a thin wrapper around `RewardService.processDailyRewards`
  that adds timing + `console.log`/`console.error` output (PMD section 27 step 9 - "log result");
  those lines show up in Hostinger's Node.js app log viewer.
- See [docs/HOSTINGER-SETUP.md](docs/HOSTINGER-SETUP.md) section 13 for the exact hPanel steps -
  schedule, the `curl`/`wget` command to use, and how to verify it's wired up correctly (running
  it twice in a row should show the second run as all-`skipped`, proving no double-credit).

### Admin API

Every route below is under `/api/admin`, requires the session cookie, and requires
`role IN ('ADMIN','SUPER_ADMIN')` - enforced once, at the top of `routes/admin.routes.js`
(`authenticate` + `authorize('ADMIN','SUPER_ADMIN')`), not repeated per route. There is no
self-service way to become an admin - promote a user by setting `role` directly in the database
(phpMyAdmin), since a "make me admin" endpoint would defeat the purpose.

```
GET   /api/admin/dashboard                       -> aggregate stats (users, deposits, withdrawals, rewards, commissions)

GET   /api/admin/users?search=&status=&page=&pageSize=
GET   /api/admin/users/:id                       -> user + wallet
POST  /api/admin/users/:id/status                { status, note? }         -> ACTIVE/SUSPENDED/BLOCKED
GET   /api/admin/users/:id/wallet
POST  /api/admin/users/:id/wallet/adjust         { field, amount, reason } -> manual ADJUSTMENT ledger entry
GET   /api/admin/users/:id/transactions?type=&status=&page=&pageSize=
GET   /api/admin/users/:id/deposits?status=&page=&pageSize=
GET   /api/admin/users/:id/withdrawals?status=&page=&pageSize=
GET   /api/admin/users/:id/referrals?page=&pageSize=

GET   /api/admin/deposits?status=&page=&pageSize=
POST  /api/admin/deposits/:id/approve            { note? }
POST  /api/admin/deposits/:id/reject             { note? }

GET   /api/admin/withdrawals?status=&page=&pageSize=
POST  /api/admin/withdrawals/:id/approve         { note? }
POST  /api/admin/withdrawals/:id/processing      { note? }
POST  /api/admin/withdrawals/:id/paid            { note? }
POST  /api/admin/withdrawals/:id/reject          { note? }

GET   /api/admin/plans                           -> every plan, any status
POST  /api/admin/plans                           { name, minAmount, maxAmount, rewardRate, rewardFrequency?, description?, status? }
PATCH /api/admin/plans/:id                       (any subset of the same fields)

GET   /api/admin/settings                        -> every app_settings row
PATCH /api/admin/settings                        { "<setting_key>": "<value>", ... } -- rejects unknown keys

GET   /api/admin/audit-logs?adminId=&action=&page=&pageSize=
```

What this phase actually did, since most of the hard logic already existed from earlier phases
being deliberately built "engine-first, admin route later":

- **Audit logging** (`services/auditLog.service.js` + `repositories/auditLog.repository.js`) came
  first, since everything else writes to it. Every admin mutation above logs into `audit_logs`
  *inside the same DB transaction* as the change itself - so the action and its audit trail
  commit or roll back together, never independently. Action names match PMD section 48
  (`DEPOSIT_APPROVED`, `WITHDRAWAL_PAID`, `USER_SUSPENDED`, `PLAN_CHANGED`, `SETTING_CHANGED`,
  `BALANCE_ADJUSTED`, ...) plus `USER_ACTIVATED` and `WITHDRAWAL_PROCESSING` added for symmetry.
- **Deposit/withdrawal approval routes** just wire up the `DepositService`/`WithdrawalService`
  functions built (and already transactional) back in Phase 6/7 - the only real change there was
  threading an `ipAddress` through for the audit log, and rejecting a deposit is now wrapped in a
  transaction with a row lock too (it wasn't before, since there was nothing else to make atomic
  with it until now).
- **Plan write side** (`createPlan`/`updatePlan` in `plan.service.js`) is new - Phase 5 built only
  the read side deliberately, waiting for this audit infrastructure.
- **Settings write side** (`updateSettings` in `settings.service.js`) validates against a hard
  allow-list of the 10 known setting keys (`admin.validator.js`'s `ALLOWED_SETTING_KEYS`) - admin
  can change values, not invent new setting keys through the API.
- **User detail sub-resources reuse existing services as-is**: `GET /api/admin/users/:id/wallet`,
  `.../deposits`, `.../withdrawals`, `.../referrals`, `.../transactions` call straight into
  `WalletService`/`DepositService`/`WithdrawalService`/`ReferralService` with the target user's id
  instead of `req.user.id` - those services were already written generically, so admin-viewing
  required no new business logic, just new routes.
- **Wallet adjustment** (`POST /api/admin/users/:id/wallet/adjust`) is the first caller of
  `WalletService.adjustBalance`, built in Phase 4 with no route until now - it's the one place an
  admin can directly move a balance outside the normal deposit/reward/referral/withdrawal flows,
  and it always produces an `ADJUSTMENT` ledger row plus a `BALANCE_ADJUSTED` audit entry, never a
  silent balance edit (PMD section 11/31).
- `POST /api/admin/withdrawals/:id/processing` was added even though the PMD's section 46 route
  list only shows approve/reject/paid - section 33's admin action list explicitly includes "mark
  processing", and the service function already existed from Phase 7, so the route was a small,
  clearly-justified gap to close rather than an invention.

### User frontend

A React SPA built with Vite - no Next.js, no Vercel. It builds to static files
(`frontend/dist/`) that the *same* Express app serves (PMD section 45: "build it into static
files and serve through the Node.js application" was the explicit preference over a separate
Next.js deployment mode, to keep Hostinger's setup to one application).

```
frontend/
  index.html
  vite.config.js          # dev-only proxy of /api -> localhost:3000, no CORS needed
  src/
    main.jsx               # entry point
    App.jsx                 # route table
    context/AuthContext.jsx # session state; GET /api/auth/me restores it on page load
    components/
      ProtectedRoute.jsx     # redirects to /login if there's no session
      AppLayout.jsx           # header + logout, wraps every authenticated page
    pages/
      LoginPage.jsx, RegisterPage.jsx
      DashboardPage.jsx       # balances + quick actions (section 36)
      PlansPage.jsx           # browse plans, jump into a deposit preselected (section 37)
      DepositPage.jsx         # plan+amount+method -> payment instructions -> submit reference
      WithdrawPage.jsx        # balance, limits, 14-day eligibility, request form (section 38)
      ReferralPage.jsx        # code, copyable link, counts, achievement progress (section 39)
      TransactionsPage.jsx    # filterable, paginated ledger (section 40)
    services/api.js         # fetch wrapper, credentials: 'include' for the session cookie
    utils/format.js         # currency/date formatting
    styles/index.css        # single mobile-first stylesheet, no CSS framework
```

One backend addition was needed to support this: **`GET /api/settings`** (public), exposing only
`minimumWithdrawal`/`maximumWithdrawal`/`withdrawalMinAccountAgeDays`/`currency`/
`referralThreshold` - the withdrawal page needs to show these limits before the user submits, and
there was previously no non-admin way to read them (`GET /api/admin/settings` returns everything
and requires admin). See `backend/src/controllers/publicSettings.controller.js`.

### Admin frontend

Same React app, same build - an `/admin/*` section gated by role, not a second frontend project
(splitting it out would fight PMD section 6's "one Hostinger application" simplicity mandate for
no real benefit). `AdminRoute` (`frontend/src/components/AdminRoute.jsx`) redirects non-admins to
`/`; this is a UI convenience only, not a security boundary - every `/api/admin/*` call is
independently re-checked server-side regardless of what the frontend shows. A visible "Admin
panel" link appears in the regular header for users whose role qualifies.

```
frontend/src/
  components/AdminRoute.jsx, AdminLayout.jsx, Pagination.jsx
  pages/admin/
    AdminDashboardPage.jsx      -> GET /api/admin/dashboard
    AdminUsersPage.jsx          -> GET /api/admin/users (search/filter/paginate)
    AdminUserDetailPage.jsx     -> profile, wallet, status actions, manual wallet adjustment,
                                    recent deposits/withdrawals/referrals/transactions for one user
    AdminDepositsPage.jsx       -> approve/reject
    AdminWithdrawalsPage.jsx    -> approve/mark processing/mark paid/reject
    AdminPlansPage.jsx          -> create/edit
    AdminReferralsPage.jsx, AdminRewardsPage.jsx, AdminTransactionsPage.jsx  -> global read-only lists
    AdminSettingsPage.jsx       -> edit any app_settings row
    AdminAuditLogsPage.jsx      -> filterable by action
```

Three small backend additions were needed to back the Referrals/Rewards/Transactions pages -
Phase 11 only ever built *per-user* list endpoints for those (`/api/admin/users/:id/referrals`
etc.), but PMD section 29 calls for standalone `/admin/referrals`, `/admin/rewards`,
`/admin/transactions` pages showing data across every user. Added, following the exact pattern
the deposits/withdrawals admin lists already used:

- `GET /api/admin/referrals?status=&page=&pageSize=` (`referralRepository.listAllAdmin`)
- `GET /api/admin/rewards?page=&pageSize=` (`rewardLedgerRepository.listAllAdmin` - the raw
  `reward_ledger` table, which had no admin-facing reader before this)
- `GET /api/admin/transactions?type=&status=&page=&pageSize=`
  (`walletTransactionRepository.listAllAdmin`)

### Security hardening

Much of PMD section 47 was already in place from earlier phases (rate limiting since Phase 3,
parameterized SQL throughout, `authenticate`/`authorize` middleware since Phase 3, secure
httpOnly cookies since Phase 3, bcrypt password hashing since Phase 3, `crypto.timingSafeEqual`
for the cron secret since Phase 10). This phase added what was left:

- **Helmet** (`app.use(helmet())`) - sets the standard security headers (X-Content-Type-Options,
  X-Frame-Options, etc.) with its default policy. If external assets/fonts/scripts are ever added
  to the frontend, Helmet's default Content-Security-Policy (`default-src 'self'`) will need a
  matching directive added, or it'll silently block them.
- **CORS**, explicitly configured rather than left as Express's implicit default - pinned to
  `APP_URL` with `credentials: true`, since the architecture is same-origin end to end and there's
  no legitimate cross-origin caller to support.
- **Explicit request size limits** - `express.json({ limit: '100kb' })` /
  `express.urlencoded({ limit: '100kb' })`, made explicit rather than relying on Express's
  implicit default of the same value.
- **CSRF protection** (double-submit cookie pattern) - the real gap, since cookie-based auth is
  inherently CSRF-exposed. On login, the backend now also sets a second, non-`httpOnly`
  `csrf_token` cookie; the frontend reads it and echoes it back as an `X-CSRF-Token` header on
  every non-GET request (`frontend/src/services/api.js`); `authenticate()` rejects any
  cookie-authenticated mutating request where the header doesn't match the cookie
  (`backend/src/middleware/authenticate.js`). A cross-site attacker can make the browser attach
  the session cookie automatically but cannot read its value to forge a matching header. This
  applies automatically to every route already behind `authenticate` (all wallet/deposit/
  withdrawal/referral/admin routes) with no per-route changes needed - and also means **any
  session created before this phase will need to log in again** once deployed, since old sessions
  never received a `csrf_token` cookie.
- **Security-event logging** (PMD section 55) - a minimal `backend/src/utils/logger.js` (no
  external logging library; Hostinger's log viewer just captures stdout/stderr). Added to: failed
  login attempts (`auth.service.js`), deposit created/approved/rejected, withdrawal created/
  approved/paid/rejected, and referral commissions credited. Admin actions were already fully
  captured by the `audit_logs` table (Phase 11), which is a stronger record than console output,
  so those weren't duplicated here. Never logs passwords or secret values.

**Legal/compliance note (PMD section 59, not a code change):** this app's reward/commission
structure resembles an investment product. Nothing in the UI or API claims a "guaranteed" or
"risk-free" return, and none of the business logic here constitutes legal or financial advice.
Before accepting real customer funds, verify the business model and payment setup against
applicable Pakistani law and JazzCash/Easypaisa's own merchant terms - that verification is
outside the scope of what this codebase can do for you.

### Testing

`node:test` (Node's built-in runner - no Jest) + `supertest`, against a real dedicated test
database (no mocking). See [docs/TESTING.md](docs/TESTING.md) for setup and the full mapping from
PMD section 56's checklist to test files - every item on that checklist has a corresponding test,
including the explicitly-flagged critical one ("run the reward job twice → exactly one reward",
in `test/rewards.test.js`).

```
test/
  helpers/testDb.js      - loads .env.test, truncates per-test data between tests
  helpers/authClient.js  - registers+logs in real users via HTTP, replays session+CSRF cookies
  unit/                  - money.js / phone.js / referralCode.js (pure functions, no DB)
  auth.test.js, deposits.test.js, withdrawals.test.js, rewards.test.js, referrals.test.js,
  admin-authorization.test.js
```

Writing these caught two real bugs before they'd have been caught any other way:

- **The test suite would have rate-limited itself.** `authLimiter` caps register/login at 10
  requests per 15 minutes; a single test file legitimately creates far more test users than that.
  Fixed by adding a `skip` option to every limiter in `rateLimiters.js` that's true only when
  `NODE_ENV=test` - production behavior is unchanged.
- **The 5-referral bonus test mutates `app_settings` directly** (`bonus_enabled`,
  `bonus_commission_rate`), which `truncateAll()` deliberately leaves alone since it's seed data,
  not per-test data. Without a reset, one test's mutation would leak into later tests. Fixed with
  a `beforeEach` in `referrals.test.js` that restores those two keys to their seeded defaults.

**This test suite has not been executed** - no Node.js has been available in the environment that
built this entire project (noted in every phase's report). It was written carefully against the
actual service/controller signatures already in the codebase, but that is review, not proof.
Running `npm test` yourself (see docs/TESTING.md for the one-time test-database setup) is the
single most valuable thing to do before trusting any of this with real money.

## Tech stack

- Node.js + Express (backend)
- React + Vite (frontend, built to static files)
- MySQL/MariaDB via `mysql2`
- Plain SQL files for schema/seed (imported through phpMyAdmin)

## Project structure

```
backend/
  server.js              # entry point
  src/
    app.js                # Express app setup + serves frontend/dist in production
    config/
      env.js               # environment variable loading/validation
      database.js          # mysql2 connection pool
    controllers/, services/, repositories/, validators/, middleware/, routes/, jobs/, utils/
frontend/
  src/
    components/, context/, pages/, services/, utils/, styles/
  dist/                  # `npm run build` output (gitignored) - served by Express in production
database/
  schema.sql              # full table definitions
  seed.sql                # 12 fixed-amount plans + default app settings
docs/
  HOSTINGER-SETUP.md      # deploying the Node.js app + frontend build on Hostinger
  DATABASE-SETUP.md       # creating the MySQL database on Hostinger
.env.example
```

## Running locally

Backend:

1. Install [Node.js](https://nodejs.org/) 18+ (not installed in this environment - see note
   below).
2. Copy the environment template and fill in your local MySQL credentials:
   ```
   cp .env.example .env
   ```
3. Install dependencies and start the server:
   ```
   npm install
   npm run dev
   ```
4. Create the database and import `database/schema.sql` then `database/seed.sql` (any local MySQL
   client, or phpMyAdmin if you're using Hostinger's database directly - see
   [docs/DATABASE-SETUP.md](docs/DATABASE-SETUP.md)).
5. Check it's running: `GET http://localhost:3000/api/health`.

Frontend (in a second terminal):

```
cd frontend
npm install
npm run dev
```

Vite serves the SPA on its own dev port (prints the URL, typically `http://localhost:5173`) and
proxies `/api/*` calls to the backend on port 3000 - no CORS setup needed. To test the production
path instead (frontend built to static files, served by Express itself), run `npm run build`
inside `frontend/` and reload `http://localhost:3000`.

## Deploying to Hostinger

See [docs/HOSTINGER-SETUP.md](docs/HOSTINGER-SETUP.md) (includes building the frontend),
[docs/DATABASE-SETUP.md](docs/DATABASE-SETUP.md), and
[docs/GITHUB-DEPLOYMENT.md](docs/GITHUB-DEPLOYMENT.md) for pushing to GitHub and deploying to
Hostinger from there (the preferred path over manual file upload).
