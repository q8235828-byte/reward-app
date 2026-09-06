// Loads .env.test INSTEAD of .env, so tests can never touch the real
// database. dotenv does not override variables already present in
// process.env, so as long as this file is required before anything that
// requires backend/src/config/env.js (which calls the default
// require('dotenv').config() for .env), these values win.
require('dotenv').config({ path: '.env.test' });

// eslint-disable-next-line import/no-dynamic-require
const pool = require('../../backend/src/config/database');

// Only test-generated, per-run data is wiped between tests. `plans` and
// `app_settings` are reference/seed data (imported once via schema.sql +
// seed.sql, same as a real deploy) and are deliberately left alone so
// tests exercise the real 5 seeded plans and real default settings.
const TEST_DATA_TABLES = [
  'audit_logs',
  'referral_commissions',
  'reward_ledger',
  'referrals',
  'wallet_transactions',
  'password_reset_tokens',
  'user_plans',
  'deposits',
  'withdrawals',
  'wallets',
  'users',
];

async function truncateAll() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (let i = 0; i < TEST_DATA_TABLES.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await pool.query(`TRUNCATE TABLE ${TEST_DATA_TABLES[i]}`);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
}

// Simulates an old account for 14-day-rule tests without waiting real
// time - withdrawal.service.js reads created_at fresh from the DB via
// authenticate() on every request, so this takes effect immediately.
async function backdateUser(userId, days) {
  await pool.query('UPDATE users SET created_at = DATE_SUB(NOW(), INTERVAL ? DAY) WHERE id = ?', [days, userId]);
}

async function closeDb() {
  await pool.end();
}

module.exports = {
  pool, truncateAll, backdateUser, closeDb,
};
