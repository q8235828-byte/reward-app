# Testing

Tests use Node's built-in test runner (`node:test` - no Jest or other framework needed) plus
`supertest` for HTTP-level assertions. There is no mocking of the database: tests run against a
**real, dedicated test database** through the real Express app, exercising the actual SQL,
transactions, and idempotency guarantees rather than a simulation of them.

## 1. Create a dedicated test database

Never point tests at your development or production database - `beforeEach` hooks truncate
tables between tests. Create a separate database the same way as
[DATABASE-SETUP.md](./DATABASE-SETUP.md), e.g. `u123456789_rewards_test`, and import both
`database/schema.sql` and `database/seed.sql` into it (tests rely on the 5 seeded plans and
default `app_settings` values being present).

## 2. Configure `.env.test`

Copy `.env.example` to `.env.test` and point `DB_NAME` (and host/user/password, if different) at
the test database. `JWT_SECRET` and `CRON_SECRET` still need values (any value works for testing -
they just need to be present, since `assertRequiredEnvVars` would otherwise reject startup, though
the test suite requires `backend/src/app.js` directly rather than calling that check).

**Set `NODE_ENV=test`.** This isn't optional - two things depend on it:

- Auth cookies are set with `secure: true` only when `NODE_ENV=production`. Since the test suite
  runs everything in-process over plain HTTP (no TLS), a `secure` cookie would never actually be
  attached by the test client, breaking every authenticated test.
- Rate limiting (`backend/src/middleware/rateLimiters.js`) is skipped when `NODE_ENV=test`. The
  suite legitimately registers/logs in far more users per test file than a real client would hit
  in the same window (`authLimiter` is capped at 10 requests/15 min; a single test file can make
  10+ register+login calls setting up scenarios) - this isn't a loosening of the limiter for
  everyone, only for this explicit environment.

## 3. Install dependencies and run

```
npm install
npm test
```

`npm test` runs `node --test test/`, which discovers every `*.test.js` file under `test/`.

## What's covered

Maps directly to the PMD's test checklist (section 56):

| Checklist item | Test file |
|---|---|
| Registration, duplicate registration, referral registration | `test/auth.test.js` |
| Login | `test/auth.test.js` |
| Deposit creation, approval, rejection, wallet update | `test/deposits.test.js` |
| Duplicate deposit approval (idempotency) | `test/deposits.test.js` |
| Withdrawal eligibility, 14-day rule, insufficient balance, duplicate withdrawal | `test/withdrawals.test.js` |
| Daily reward, **duplicate daily reward (the PMD's explicitly flagged critical test)** | `test/rewards.test.js` |
| No compounding | `test/rewards.test.js` |
| Referral commission, duplicate referral commission | `test/referrals.test.js` |
| 5+ referral qualification / bonus tier | `test/referrals.test.js` |
| Admin authorization | `test/admin-authorization.test.js` |
| CSRF protection (added in Phase 14, not in the original PMD checklist) | `test/admin-authorization.test.js` |
| Money math precision, phone normalization, referral code format | `test/unit/*.test.js` |

## What's not covered

- The frontend (React SPA / admin panel) has no automated tests - PMD phases 12/13 built it, but
  no test tooling (e.g. Vitest, React Testing Library) was set up. Manual browser testing is the
  only verification path today.
- JazzCash/Easypaisa official API integration - not applicable, since this app only implements
  manual verification (PMD section 17/18 explicitly forbid fabricating payment gateway responses).
- Load/performance testing - out of scope for a Hostinger shared-hosting deployment of this size.

## Important caveat

**This test suite has not been executed.** It was written without a working Node.js installation
available in the environment that built it (every phase of this project notes the same
constraint). The code was carefully hand-reviewed for correctness against the actual service/
controller signatures, but "reviewed" is not "run" - treat this as a strong starting point, not a
green checkmark, until you run `npm test` yourself and see it pass.
