require('dotenv').config();

const REQUIRED_VARS = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'CRON_SECRET'];

function getEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
}

function assertRequiredEnvVars() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const sessionDays = Number(getEnv('SESSION_DAYS', 7));

module.exports = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: Number(getEnv('PORT', 3000)),
  appUrl: getEnv('APP_URL', 'http://localhost:3000'),
  db: {
    host: getEnv('DB_HOST'),
    port: Number(getEnv('DB_PORT', 3306)),
    name: getEnv('DB_NAME'),
    user: getEnv('DB_USER'),
    password: getEnv('DB_PASSWORD'),
  },
  jwt: {
    secret: getEnv('JWT_SECRET'),
    expiresIn: `${sessionDays}d`,
  },
  auth: {
    cookieName: 'token',
    // Deliberately NOT httpOnly - the frontend must be able to read it to
    // echo it back as the X-CSRF-Token header (double-submit cookie
    // pattern). It carries no authority on its own; only proves the
    // request originated from a page that could read this origin's
    // cookies, which a cross-site attacker's forged request cannot.
    csrfCookieName: 'csrf_token',
    cookieMaxAgeMs: sessionDays * 24 * 60 * 60 * 1000,
    resetTokenExpiryMinutes: Number(getEnv('RESET_TOKEN_EXPIRY_MINUTES', 60)),
  },
  mail: {
    host: getEnv('SMTP_HOST'),
    port: Number(getEnv('SMTP_PORT', 587)),
    secure: getEnv('SMTP_SECURE', 'false') === 'true',
    user: getEnv('SMTP_USER'),
    password: getEnv('SMTP_PASSWORD'),
    from: getEnv('MAIL_FROM', 'no-reply@example.com'),
  },
  cron: {
    secret: getEnv('CRON_SECRET'),
  },
  payments: {
    // Manual verification account details (where users are told to send
    // money). Left unset until an admin configures them.
    jazzCash: {
      accountTitle: getEnv('JAZZCASH_ACCOUNT_TITLE'),
      accountNumber: getEnv('JAZZCASH_ACCOUNT_NUMBER'),
    },
    easypaisa: {
      accountTitle: getEnv('EASYPAISA_ACCOUNT_TITLE'),
      accountNumber: getEnv('EASYPAISA_ACCOUNT_NUMBER'),
    },
  },
  assertRequiredEnvVars,
};
