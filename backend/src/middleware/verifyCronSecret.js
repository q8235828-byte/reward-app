const crypto = require('crypto');
const env = require('../config/env');
const AppError = require('../utils/AppError');

function safeCompare(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Guards internal endpoints Hostinger Cron calls directly - there is no
// user session involved, only Authorization: Bearer <CRON_SECRET>.
function verifyCronSecret(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token || !env.cron.secret || !safeCompare(token, env.cron.secret)) {
    return next(new AppError(401, 'Invalid or missing cron secret.', 'CRON_UNAUTHORIZED'));
  }
  return next();
}

module.exports = { verifyCronSecret };
