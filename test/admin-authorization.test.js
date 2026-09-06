const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { pool, truncateAll, closeDb } = require('./helpers/testDb');
const { createAuthenticatedClient, createAdminClient } = require('./helpers/authClient');

// eslint-disable-next-line import/no-dynamic-require
const app = require('../backend/src/app');

beforeEach(async () => { await truncateAll(); });
after(async () => { await closeDb(); });

test('an unauthenticated request to an admin route is rejected', async () => {
  const res = await request(app).get('/api/admin/dashboard');
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'AUTH_REQUIRED');
});

test('a regular (non-admin) user cannot access admin routes', async () => {
  const client = await createAuthenticatedClient(app);
  const res = await client.get('/api/admin/dashboard');
  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'FORBIDDEN');
});

test('a promoted admin can access admin routes', async () => {
  const admin = await createAdminClient(app, pool);
  const res = await admin.get('/api/admin/dashboard');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(typeof res.body.data.stats.totalUsers === 'number');
});

test('a suspended admin loses access on their very next request', async () => {
  const admin = await createAdminClient(app, pool);
  await pool.query("UPDATE users SET status = 'SUSPENDED' WHERE id = ?", [admin.userId]);

  const res = await admin.get('/api/admin/dashboard');
  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'ACCOUNT_NOT_ACTIVE');
});

test('a mutating admin request without a matching CSRF header is rejected even with a valid session cookie', async () => {
  const admin = await createAdminClient(app, pool);

  const res = await request(app)
    .patch('/api/admin/settings')
    .set('Cookie', admin.cookieHeader)
    // Deliberately no X-CSRF-Token header - simulates a forged cross-site request.
    .send({ currency: 'PKR' });

  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'CSRF_TOKEN_INVALID');
});

test('a mutating admin request with the correct CSRF header succeeds', async () => {
  const admin = await createAdminClient(app, pool);
  const res = await admin.patch('/api/admin/settings').send({ currency: 'PKR' });
  assert.equal(res.status, 200);
});
