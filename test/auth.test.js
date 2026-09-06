const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { pool, truncateAll, closeDb } = require('./helpers/testDb');

// eslint-disable-next-line import/no-dynamic-require
const app = require('../backend/src/app');

beforeEach(async () => { await truncateAll(); });
after(async () => { await closeDb(); });

test('registration creates a user and a zero-balance wallet', async () => {
  const res = await request(app).post('/api/auth/register').send({
    fullName: 'Ayesha Khan',
    email: 'ayesha@example.com',
    phone: '03001234567',
    password: 'password123',
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.user.email, 'ayesha@example.com');
  assert.ok(res.body.data.user.referralCode, 'a referral code must be generated');
  assert.equal(res.body.data.user.password_hash, undefined, 'password hash must never be returned');

  const [wallets] = await pool.query('SELECT * FROM wallets WHERE user_id = ?', [res.body.data.user.id]);
  assert.equal(wallets.length, 1);
  assert.equal(Number(wallets[0].withdrawable_balance), 0);
});

test('duplicate email registration is rejected', async () => {
  const payload = {
    fullName: 'Ayesha Khan', email: 'dup@example.com', phone: '03001234567', password: 'password123',
  };
  const first = await request(app).post('/api/auth/register').send(payload);
  assert.equal(first.status, 201);

  const second = await request(app).post('/api/auth/register').send({ ...payload, phone: '03001234568' });
  assert.equal(second.status, 409);
  assert.equal(second.body.code, 'EMAIL_TAKEN');
});

test('duplicate phone registration is rejected', async () => {
  const payload = {
    fullName: 'Ayesha Khan', email: 'a@example.com', phone: '03009999999', password: 'password123',
  };
  const first = await request(app).post('/api/auth/register').send(payload);
  assert.equal(first.status, 201);

  const second = await request(app).post('/api/auth/register').send({ ...payload, email: 'b@example.com' });
  assert.equal(second.status, 409);
  assert.equal(second.body.code, 'PHONE_TAKEN');
});

test('registration with a valid referral code links the referrer permanently', async () => {
  const referrer = await request(app).post('/api/auth/register').send({
    fullName: 'Referrer One', email: 'referrer@example.com', phone: '03001111111', password: 'password123',
  });
  const { referralCode } = referrer.body.data.user;

  const referred = await request(app).post('/api/auth/register').send({
    fullName: 'Referred User',
    email: 'referred@example.com',
    phone: '03002222222',
    password: 'password123',
    referralCode,
  });
  assert.equal(referred.status, 201);

  const [rows] = await pool.query('SELECT * FROM referrals WHERE referral_code = ?', [referralCode]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].referred_user_id, referred.body.data.user.id);
  assert.equal(rows[0].status, 'NOT_QUALIFIED');
});

test('registration with an invalid referral code is rejected', async () => {
  const res = await request(app).post('/api/auth/register').send({
    fullName: 'Someone',
    email: 'someone@example.com',
    phone: '03003333333',
    password: 'password123',
    referralCode: 'NOTREAL1',
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'INVALID_REFERRAL_CODE');
});

test('login succeeds with correct credentials and sets session + CSRF cookies', async () => {
  await request(app).post('/api/auth/register').send({
    fullName: 'Login Test', email: 'login@example.com', phone: '03004444444', password: 'password123',
  });

  const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'password123' });
  assert.equal(res.status, 200);

  const cookies = (res.headers['set-cookie'] || []).join(';');
  assert.match(cookies, /token=/);
  assert.match(cookies, /csrf_token=/);
});

test('login fails with the wrong password', async () => {
  await request(app).post('/api/auth/register').send({
    fullName: 'Login Test 2', email: 'login2@example.com', phone: '03005555555', password: 'password123',
  });

  const res = await request(app).post('/api/auth/login').send({ email: 'login2@example.com', password: 'wrongpass' });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'INVALID_CREDENTIALS');
});

test('login fails for a nonexistent email with the same generic message (no user enumeration)', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'password123' });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'INVALID_CREDENTIALS');
});
