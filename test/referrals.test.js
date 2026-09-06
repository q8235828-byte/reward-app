const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, truncateAll, closeDb } = require('./helpers/testDb');
const { createAuthenticatedClient, createAdminClient } = require('./helpers/authClient');
const walletService = require('../backend/src/services/wallet.service');
const referralService = require('../backend/src/services/referral.service');
const depositService = require('../backend/src/services/deposit.service');

// eslint-disable-next-line import/no-dynamic-require
const app = require('../backend/src/app');

beforeEach(async () => {
  await truncateAll();
  // app_settings is seed data, deliberately not touched by truncateAll -
  // but the bonus-tier test below mutates it directly, so reset it to the
  // seeded defaults before every test regardless of what a previous test
  // in this file left behind.
  await pool.query("UPDATE app_settings SET setting_value = 'false' WHERE setting_key = 'bonus_enabled'");
  await pool.query("UPDATE app_settings SET setting_value = '0.00' WHERE setting_key = 'bonus_commission_rate'");
});
after(async () => { await closeDb(); });

async function getStarterPlanId() {
  const [rows] = await pool.query("SELECT id FROM plans WHERE name = 'Starter' LIMIT 1");
  if (!rows[0]) throw new Error('Starter plan not found - did you import database/seed.sql into the test database?');
  return rows[0].id;
}

async function depositAndApprove(admin, client, planId, amount = 1000) {
  const created = await client.post('/api/deposits').send({ planId, amount, paymentMethod: 'JAZZCASH' });
  const depositId = created.body.data.deposit.id;
  const approved = await admin.post(`/api/admin/deposits/${depositId}/approve`).send({});
  assert.equal(approved.status, 200, `test setup deposit approval failed: ${JSON.stringify(approved.body)}`);
  return approved.body.data.deposit;
}

test('an approved deposit from a referred user pays the referrer a commission and qualifies the referral', async () => {
  const referrer = await createAuthenticatedClient(app);
  const referred = await createAuthenticatedClient(app, { referralCode: referrer.referralCode });
  const admin = await createAdminClient(app, pool);
  const planId = await getStarterPlanId();

  await depositAndApprove(admin, referred, planId, 1000);

  const [settings] = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'referral_commission_rate'");
  const expectedCommission = (1000 * Number(settings[0].setting_value)) / 100;

  const referrerWallet = await walletService.getWalletByUserId(referrer.userId);
  assert.equal(Number(referrerWallet.referralBalance), expectedCommission);

  const [referrals] = await pool.query('SELECT status FROM referrals WHERE referred_user_id = ?', [referred.userId]);
  assert.equal(referrals[0].status, 'QUALIFIED', "the referred user's first approved deposit should qualify the referral");
});

test('CRITICAL: retrying deposit approval never generates a duplicate commission', async () => {
  const referrer = await createAuthenticatedClient(app);
  const referred = await createAuthenticatedClient(app, { referralCode: referrer.referralCode });
  const admin = await createAdminClient(app, pool);
  const planId = await getStarterPlanId();

  const deposit = await depositAndApprove(admin, referred, planId, 1000);

  // Simulate a retried approval directly at the service layer (the HTTP
  // route already no-ops on a repeat call - see deposits.test.js - this
  // confirms the underlying commission logic is independently idempotent
  // too, not only protected by the higher-level status check).
  await depositService.approveDeposit({ depositId: deposit.id, adminId: admin.userId, note: 'retry' });

  const [rows] = await pool.query(
    'SELECT COUNT(*) AS count FROM referral_commissions WHERE referred_user_id = ?',
    [referred.userId],
  );
  assert.equal(Number(rows[0].count), 1, 'exactly one commission, even if approval is retried');

  const referrerWallet = await walletService.getWalletByUserId(referrer.userId);
  const [settings] = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'referral_commission_rate'");
  const expectedCommission = (1000 * Number(settings[0].setting_value)) / 100;
  assert.equal(Number(referrerWallet.referralBalance), expectedCommission, 'commission must not be doubled');
});

test('5+ qualifying referrals unlock the bonus commission rate for the next commission', async () => {
  const referrer = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  const planId = await getStarterPlanId();

  await pool.query("UPDATE app_settings SET setting_value = 'true' WHERE setting_key = 'bonus_enabled'");
  await pool.query("UPDATE app_settings SET setting_value = '5' WHERE setting_key = 'bonus_commission_rate'");

  for (let i = 0; i < 5; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const referred = await createAuthenticatedClient(app, { referralCode: referrer.referralCode });
    // eslint-disable-next-line no-await-in-loop
    await depositAndApprove(admin, referred, planId, 1000);
  }

  const stats = await referralService.getReferralStats(referrer.userId);
  assert.equal(stats.qualifiedReferrals, 5);
  assert.equal(stats.achievementQualified, true);

  const sixthReferred = await createAuthenticatedClient(app, { referralCode: referrer.referralCode });
  const walletBefore = await walletService.getWalletByUserId(referrer.userId);
  await depositAndApprove(admin, sixthReferred, planId, 1000);
  const walletAfter = await walletService.getWalletByUserId(referrer.userId);

  const [baseRateRows] = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'referral_commission_rate'");
  const boostedRate = Number(baseRateRows[0].setting_value) + 5;
  const expectedSixthCommission = (1000 * boostedRate) / 100;
  const actualDelta = Number(walletAfter.referralBalance) - Number(walletBefore.referralBalance);
  assert.equal(actualDelta, expectedSixthCommission, "the 6th referrer's commission should include the bonus rate");
});
