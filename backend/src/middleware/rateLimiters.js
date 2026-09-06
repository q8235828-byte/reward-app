const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// The test suite (see /test) legitimately makes far more register/login/
// deposit/withdrawal calls per process than a real client would in the
// same window - it creates a fresh user (register + login) for nearly
// every scenario. Rate limiting itself isn't under test, so it's skipped
// when NODE_ENV=test (set in .env.test - see docs/TESTING.md) rather than
// loosened for everyone, which would weaken it in production.
const skipInTests = () => env.nodeEnv === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: 'Too many password reset requests. Please try again later.', code: 'RATE_LIMITED' },
});

const depositLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: 'Too many deposit requests. Please try again later.', code: 'RATE_LIMITED' },
});

const withdrawalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: 'Too many withdrawal requests. Please try again later.', code: 'RATE_LIMITED' },
});

// The cron job calls this once a day - a generous cap that still blocks
// abuse if the secret ever leaks.
const cronLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: 'Too many requests to this endpoint.', code: 'RATE_LIMITED' },
});

module.exports = {
  authLimiter, passwordResetLimiter, depositLimiter, withdrawalLimiter, cronLimiter,
};
