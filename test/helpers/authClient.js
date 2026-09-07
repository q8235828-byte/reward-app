const request = require('supertest');

// Registers + logs in a user through the real HTTP endpoints and returns a
// small client that replays the session + CSRF cookies on every call -
// exactly what the frontend does (frontend/src/services/api.js) - so
// these tests exercise the real CSRF enforcement instead of bypassing it.
async function createAuthenticatedClient(app, overrides = {}) {
  const unique = String(Math.floor(100000000 + Math.random() * 899999999));
  const payload = {
    fullName: 'Test User',
    phone: `03${unique}`,
    password: 'password123',
    ...overrides,
  };

  const registerRes = await request(app).post('/api/auth/register').send(payload);
  if (registerRes.status !== 201) {
    throw new Error(`Test helper registration failed: ${JSON.stringify(registerRes.body)}`);
  }

  const loginRes = await request(app).post('/api/auth/login').send({
    phone: payload.phone, password: payload.password,
  });
  if (loginRes.status !== 200) {
    throw new Error(`Test helper login failed: ${JSON.stringify(loginRes.body)}`);
  }

  const setCookieHeaders = loginRes.headers['set-cookie'] || [];
  const cookieHeader = setCookieHeaders.map((c) => c.split(';')[0]).join('; ');
  const csrfMatch = cookieHeader.match(/csrf_token=([^;]+)/);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;

  const withAuth = (req) => req.set('Cookie', cookieHeader).set('X-CSRF-Token', csrfToken || '');

  return {
    userId: registerRes.body.data.user.id,
    phone: payload.phone,
    referralCode: registerRes.body.data.user.referralCode,
    cookieHeader,
    csrfToken,
    get: (path) => withAuth(request(app).get(path)),
    post: (path) => withAuth(request(app).post(path)),
    patch: (path) => withAuth(request(app).patch(path)),
  };
}

// Promotes the client's user to ADMIN directly in the DB (there is no API
// for this by design - see README's Admin API section) and returns the
// same client shape. Role isn't part of the JWT payload and authenticate()
// re-reads the user fresh every request, so no re-login is needed after
// promotion.
async function createAdminClient(app, pool, overrides = {}) {
  const client = await createAuthenticatedClient(app, overrides);
  await pool.query("UPDATE users SET role = 'ADMIN' WHERE id = ?", [client.userId]);
  return client;
}

module.exports = { createAuthenticatedClient, createAdminClient };
