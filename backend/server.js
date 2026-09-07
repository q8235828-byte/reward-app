const app = require('./src/app');
const env = require('./src/config/env');
const pool = require('./src/config/database');
const userRepository = require('./src/repositories/user.repository');
const { normalizePhone } = require('./src/utils/phone');

env.assertRequiredEnvVars();

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
});

// Non-blocking connectivity check: proves the MySQL configuration works
// without preventing the server (and /api/health) from starting.
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully.');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
})();

// ADMIN_PHONE bootstrap (see config/env.js): if that phone number already
// belongs to a registered user, grant SUPER_ADMIN on every startup - covers
// the case where the account existed before ADMIN_PHONE was set (a brand
// new registration is instead handled directly in auth.service.js#register).
// Idempotent and a safe no-op if no user with that phone exists yet.
(async () => {
  if (!env.admin.phone) return;
  const normalizedAdminPhone = normalizePhone(env.admin.phone);
  if (!normalizedAdminPhone) {
    console.error(`ADMIN_PHONE (${env.admin.phone}) is not a valid Pakistani mobile number - skipping admin bootstrap.`);
    return;
  }
  try {
    await userRepository.promoteByPhone(pool, normalizedAdminPhone, 'SUPER_ADMIN');
    console.log(`ADMIN_PHONE bootstrap checked for ${normalizedAdminPhone}.`);
  } catch (error) {
    console.error('ADMIN_PHONE bootstrap failed:', error.message);
  }
})();

module.exports = server;
