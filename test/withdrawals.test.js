const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, truncateAll, backdateUser, closeDb } = require('./helpers/testDb');
const { createAuthenticatedClient, createAdminClient } = require('./helpers/authClient');
const walletService = require('../backend/src/services/wallet.service');

// eslint-disable-next-line import/no-dynamic-require
const app = require('../backend/src/app');

const WITHDRAW_PAYLOAD = { paymentMethod: 'JAZZCASH', accountName: 'Test User', accountNumber: '03001234567' };

beforeEach(async () => { await truncateAll(); });
after(async () => { await closeDb(); });

async function giveWithdrawableBalance(admin, userId, amount) {
  const res = await admin.post(`/api/admin/users/${userId}/wallet/adjust`).send({
    field: 'withdrawable', amount, reason: 'test setup - manual balance grant',
  });
  assert.equal(res.status, 200, `test setup failed: ${JSON.stringify(res.body)}`);
}

test('withdrawal is rejected for an account younger than 14 days', async () => {
  const client = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  await giveWithdrawableBalance(admin, client.userId, 5000);
  // Freshly registered - created_at is "now", well under 14 days old.

  const res = await client.post('/api/withdrawals').send({ ...WITHDRAW_PAYLOAD, amount: 1000 });
  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'ACCOUNT_TOO_NEW');
});

test('withdrawal succeeds for an eligible account and reserves the amount immediately', async () => {
  const client = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  await backdateUser(client.userId, 20);
  await giveWithdrawableBalance(admin, client.userId, 5000);

  const res = await client.post('/api/withdrawals').send({ ...WITHDRAW_PAYLOAD, amount: 1000 });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.withdrawal.status, 'PENDING');

  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(Number(wallet.withdrawableBalance), 4000, 'the requested amount must be reserved/deducted at request time');
});

test('withdrawal is rejected when the amount exceeds the withdrawable balance', async () => {
  const client = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  await backdateUser(client.userId, 20);
  await giveWithdrawableBalance(admin, client.userId, 500);

  const res = await client.post('/api/withdrawals').send({ ...WITHDRAW_PAYLOAD, amount: 2000 });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'INSUFFICIENT_BALANCE');
});

test('CRITICAL: a second withdrawal request is rejected while one is already pending (no double withdrawal)', async () => {
  const client = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  await backdateUser(client.userId, 20);
  await giveWithdrawableBalance(admin, client.userId, 5000);

  const first = await client.post('/api/withdrawals').send({ ...WITHDRAW_PAYLOAD, amount: 1000 });
  assert.equal(first.status, 201);

  const second = await client.post('/api/withdrawals').send({ ...WITHDRAW_PAYLOAD, amount: 500 });
  assert.equal(second.status, 409);
  assert.equal(second.body.code, 'WITHDRAWAL_IN_PROGRESS');

  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(Number(wallet.withdrawableBalance), 4000, 'only the first request may have reserved funds');
});

test('rejecting a withdrawal refunds the reserved balance', async () => {
  const client = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  await backdateUser(client.userId, 20);
  await giveWithdrawableBalance(admin, client.userId, 5000);

  const created = await client.post('/api/withdrawals').send({ ...WITHDRAW_PAYLOAD, amount: 1000 });
  const withdrawalId = created.body.data.withdrawal.id;

  const rejected = await admin.post(`/api/admin/withdrawals/${withdrawalId}/reject`).send({});
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.data.withdrawal.status, 'REJECTED');

  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(Number(wallet.withdrawableBalance), 5000, 'the reserved amount must be returned on rejection');
});

test('marking a withdrawal paid does not move money again (it was already reserved)', async () => {
  const client = await createAuthenticatedClient(app);
  const admin = await createAdminClient(app, pool);
  await backdateUser(client.userId, 20);
  await giveWithdrawableBalance(admin, client.userId, 5000);

  const created = await client.post('/api/withdrawals').send({ ...WITHDRAW_PAYLOAD, amount: 1000 });
  const withdrawalId = created.body.data.withdrawal.id;

  await admin.post(`/api/admin/withdrawals/${withdrawalId}/approve`).send({});
  const paid = await admin.post(`/api/admin/withdrawals/${withdrawalId}/paid`).send({});
  assert.equal(paid.status, 200);
  assert.equal(paid.body.data.withdrawal.status, 'PAID');

  const wallet = await walletService.getWalletByUserId(client.userId);
  assert.equal(Number(wallet.withdrawableBalance), 4000, 'balance must stay at the amount reserved at request time');
  assert.equal(Number(wallet.totalWithdrawn), 1000);
});
