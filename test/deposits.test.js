const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, truncateAll, closeDb } = require('./helpers/testDb');
const { createAuthenticatedClient, createAdminClient } = require('./helpers/authClient');
const walletService = require('../backend/src/services/wallet.service');

// eslint-disable-next-line import/no-dynamic-require
const app = require('../backend/src/app');

beforeEach(async () => { await truncateAll(); });
after(async () => { await closeDb(); });

async function getStarterPlan() {
  const [rows] = await pool.query("SELECT * FROM plans WHERE name = 'Starter' LIMIT 1");
  if (!rows[0]) throw new Error('Starter plan not found - did you import database/seed.sql into the test database?');
  return rows[0];
}

test('deposit amount outside the plan range is rejected', async () => {
  const client = await createAuthenticatedClient(app);
  const plan = await getStarterPlan();

  const res = await client.post('/api/deposits').send({ planId: plan.id, amount: 10, paymentMethod: 'JAZZCASH' });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'AMOUNT_OUT_OF_RANGE');
});

test('deposit creation succeeds and starts PENDING with payment instructions', async () => {
  const client = await createAuthenticatedClient(app);
  const plan = await getStarterPlan();

  const res = await client.post('/api/deposits').send({ planId: plan.id, amount: 1000, paymentMethod: 'JAZZCASH' });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.deposit.status, 'PENDING');
  assert.equal(res.body.data.paymentInstructions.method, 'JAZZCASH');
});

test('submitting a transaction reference moves the deposit to UNDER_REVIEW', async () => {
  const client = await createAuthenticatedClient(app);
  const plan = await getStarterPlan();

  const created = await client.post('/api/deposits').send({ planId: plan.id, amount: 1000, paymentMethod: 'JAZZCASH' });
  const depositId = created.body.data.deposit.id;

  const res = await client.post(`/api/deposits/${depositId}/reference`).send({ transactionReference: 'TXN123456' });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.deposit.status, 'UNDER_REVIEW');
  assert.equal(res.body.data.deposit.transactionReference, 'TXN123456');
});

test('approving a deposit credits the wallet and activates a plan', async () => {
  const client = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  const plan = await getStarterPlan();

  const created = await client.post('/api/deposits').send({ planId: plan.id, amount: 1000, paymentMethod: 'JAZZCASH' });
  const depositId = created.body.data.deposit.id;

  const approved = await admin.post(`/api/admin/deposits/${depositId}/approve`).send({});
  assert.equal(approved.status, 200);
  assert.equal(approved.body.data.deposit.status, 'APPROVED');

  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(Number(wallet.depositBalance), 1000);

  const [userPlans] = await pool.query('SELECT * FROM user_plans WHERE user_id = ?', [client.userId]);
  assert.equal(userPlans.length, 1);
  assert.equal(userPlans[0].status, 'ACTIVE');
  assert.equal(Number(userPlans[0].amount), 1000);
});

test('CRITICAL: approving the same deposit twice only credits the wallet once', async () => {
  const client = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  const plan = await getStarterPlan();

  const created = await client.post('/api/deposits').send({ planId: plan.id, amount: 1000, paymentMethod: 'JAZZCASH' });
  const depositId = created.body.data.deposit.id;

  const first = await admin.post(`/api/admin/deposits/${depositId}/approve`).send({});
  const second = await admin.post(`/api/admin/deposits/${depositId}/approve`).send({});
  assert.equal(first.status, 200);
  assert.equal(second.status, 200, 'a repeat approval must be a safe no-op, not an error');

  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(Number(wallet.depositBalance), 1000, 'wallet must not be double-credited');

  const [rows] = await pool.query(
    "SELECT COUNT(*) AS count FROM wallet_transactions WHERE user_id = ? AND type = 'DEPOSIT'",
    [client.userId],
  );
  assert.equal(Number(rows[0].count), 1);

  const [userPlans] = await pool.query('SELECT * FROM user_plans WHERE user_id = ?', [client.userId]);
  assert.equal(userPlans.length, 1, 'plan must not be activated twice');
});

test('rejecting a deposit does not credit the wallet or activate a plan', async () => {
  const client = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  const plan = await getStarterPlan();

  const created = await client.post('/api/deposits').send({ planId: plan.id, amount: 1000, paymentMethod: 'JAZZCASH' });
  const depositId = created.body.data.deposit.id;

  const rejected = await admin.post(`/api/admin/deposits/${depositId}/reject`).send({ note: 'fake reference' });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.data.deposit.status, 'REJECTED');

  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(Number(wallet.depositBalance), 0);

  const [userPlans] = await pool.query('SELECT * FROM user_plans WHERE user_id = ?', [client.userId]);
  assert.equal(userPlans.length, 0);
});
