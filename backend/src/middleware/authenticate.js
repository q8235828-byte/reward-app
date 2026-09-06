const { verifyToken } = require('../utils/jwt');
const pool = require('../config/database');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Double-submit cookie CSRF check. Only meaningful for cookie-based auth
// (which is why it lives here, not as a standalone route middleware) -
// login/register/password-reset don't use an existing session cookie to
// authorize anything, so they're unaffected. A cross-site attacker can
// make the browser send the session cookie automatically, but cannot read
// its value to also produce a matching X-CSRF-Token header.
function verifyCsrf(req) {
  if (SAFE_METHODS.has(req.method)) return true;
  const cookieToken = req.cookies ? req.cookies[env.auth.csrfCookieName] : undefined;
  const headerToken = req.get('X-CSRF-Token');
  return Boolean(cookieToken) && cookieToken === headerToken;
}

async function authenticate(req, res, next) {
  try {
    const token = req.cookies ? req.cookies[env.auth.cookieName] : undefined;
    if (!token) throw new AppError(401, 'Authentication required.', 'AUTH_REQUIRED');

    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      throw new AppError(401, 'Invalid or expired session.', 'AUTH_INVALID');
    }

    const user = await userRepository.findById(pool, payload.sub);
    if (!user) throw new AppError(401, 'Invalid or expired session.', 'AUTH_INVALID');

    // Rejects tokens issued before the user's last logout/password change,
    // and blocks a still-valid token the instant status changes elsewhere.
    if (payload.tv !== user.token_version) {
      throw new AppError(401, 'Invalid or expired session.', 'AUTH_INVALID');
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'Account is not active.', 'ACCOUNT_NOT_ACTIVE');
    }
    if (!verifyCsrf(req)) {
      throw new AppError(403, 'Invalid or missing CSRF token.', 'CSRF_TOKEN_INVALID');
    }

    req.user = userRepository.sanitizeUser(user);
    next();
  } catch (error) {
    next(error);
  }
}

// Never trust a role sent by the frontend - only req.user, populated above
// from the database, is used for authorization decisions.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action.', 'FORBIDDEN'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
