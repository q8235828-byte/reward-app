const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, truncateAll, closeDb } = require('./helpers/testDb');
const { createAuthenticatedClient, createAdminClient } = require('./helpers/authClient');
const rewardService = require('../backend/src/services/reward.service');
const walletService = require('../backend/src/services/wallet.service');

// eslint-disable-next-line import/no-dynamic-require
const app = require('../backend/src/app');

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(async () => { await truncateAll(); });
after(async () => { await closeDb(); });

// Registers a user, deposits into Plan.1 (fixed amount, 40-day duration -
// see database/seed.sql), and gets it approved - leaving one ACTIVE
// user_plan ready for the reward engine to process.
async function setUpActivePlan() {
  const client = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  const [plans] = await pool.query("SELECT * FROM plans WHERE name = 'Plan.1' LIMIT 1");
  const plan = plans[0];
  if (!plan) throw new Error('Plan.1 not found - did you import database/seed.sql into the test database?');

  const amount = Number(plan.min_amount);
  const created = await client.post('/api/deposits').send({ planId: plan.id, amount, paymentMethod: 'JAZZCASH' });
  await admin.post(`/api/admin/deposits/${created.body.data.deposit.id}/approve`).send({});

  return {
    client, admin, plan, amount,
  };
}

test('the daily reward job credits the wallet for an active plan', async () => {
  const { client, plan, amount } = await setUpActivePlan();

  const summary = await rewardService.processDailyRewards(new Date());
  assert.equal(summary.processed, 1);
  assert.equal(summary.failed, 0);

  const expectedReward = (amount * Number(plan.reward_rate)) / 100;
  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(Number(wallet.rewardBalance), expectedReward);
  assert.equal(Number(wallet.withdrawableBalance), expectedReward);
});

test('CRITICAL: running the daily reward job twice for the same day pays exactly one reward', async () => {
  const { client, plan, amount } = await setUpActivePlan();
  const today = new Date();

  const first = await rewardService.processDailyRewards(today);
  const second = await rewardService.processDailyRewards(today);

  assert.equal(first.processed, 1);
  assert.equal(second.processed, 0, 'the second run must not process it again');
  assert.equal(second.skipped, 1, 'the second run must report it as already processed');

  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM reward_ledger WHERE user_id = ?', [client.userId]);
  assert.equal(Number(rows[0].count), 1, 'reward_ledger must have exactly one row, not two');

  const expectedReward = (amount * Number(plan.reward_rate)) / 100;
  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(Number(wallet.rewardBalance), expectedReward, 'reward balance must not be doubled by the second run');
});

test('no compounding: two different days each pay the same fixed amount on the original principal', async () => {
  const { client, plan, amount } = await setUpActivePlan();
  const day1 = new Date();
  const day2 = new Date(day1.getTime() + DAY_MS);

  await rewardService.processDailyRewards(day1);
  await rewardService.processDailyRewards(day2);

  const expectedPerDay = (amount * Number(plan.reward_rate)) / 100;
  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(
    Number(wallet.rewardBalance),
    Number((expectedPerDay * 2).toFixed(2)),
    'two equal daily rewards on the fixed principal, not compounding growth',
  );
});

test('a plan with no reward due yet (inactive/nonexistent) processes nothing', async () => {
  const summary = await rewardService.processDailyRewards(new Date());
  assert.equal(summary.processed, 0);
  assert.equal(summary.failed, 0);
});

test('a plan stops paying and is marked COMPLETED once it reaches its duration', async () => {
  const { client, plan, amount } = await setUpActivePlan();
  assert.ok(plan.duration_days > 0, 'Plan.1 is expected to have a duration_days set in seed.sql');

  const startDay = new Date();
  const matureDay = new Date(startDay.getTime() + plan.duration_days * DAY_MS);

  await rewardService.processDailyRewards(startDay);
  const summary = await rewardService.processDailyRewards(matureDay);
  assert.equal(summary.processed, 0, 'no reward should be paid on/after the maturity date');

  const [userPlans] = await pool.query('SELECT * FROM user_plans WHERE user_id = ?', [client.userId]);
  assert.equal(userPlans[0].status, 'COMPLETED', 'the user_plan must be marked COMPLETED once it matures');
  assert.ok(userPlans[0].ended_at, 'ended_at must be set once the plan matures');

  // No more rewards even if the job runs again well past maturity.
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM reward_ledger WHERE user_id = ?', [client.userId]);
  const expectedPerDay = (amount * Number(plan.reward_rate)) / 100;
  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(Number(rows[0].count), 1, 'only the one reward paid before maturity should exist');
  assert.equal(Number(wallet.rewardBalance), expectedPerDay);
});
