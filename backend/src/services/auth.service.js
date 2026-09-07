const crypto = require('crypto');
const pool = require('../config/database');
const userRepository = require('../repositories/user.repository');
const walletRepository = require('../repositories/wallet.repository');
const referralRepository = require('../repositories/referral.repository');
const passwordResetTokenRepository = require('../repositories/passwordResetToken.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { generateReferralCode } = require('../utils/referralCode');
const { normalizePhone } = require('../utils/phone');
const AppError = require('../utils/AppError');
const smsService = require('./sms.service');
const logger = require('../utils/logger');
const env = require('../config/env');

const MAX_REFERRAL_CODE_ATTEMPTS = 5;

const STATUS_MESSAGES = {
  SUSPENDED: 'Your account has been suspended. Please contact support.',
  BLOCKED: 'Your account has been blocked. Please contact support.',
  PENDING: 'Your account is pending approval.',
};

async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < MAX_REFERRAL_CODE_ATTEMPTS; attempt += 1) {
    const code = generateReferralCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await userRepository.referralCodeExists(pool, code);
    if (!exists) return code;
  }
  throw new AppError(500, 'Could not generate a unique referral code. Please try again.', 'REFERRAL_CODE_GENERATION_FAILED');
}

async function register({
  fullName, phone, password, referralCode,
}) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new AppError(400, 'Enter a valid Pakistani mobile number.', 'INVALID_PHONE');
  }

  const existingPhone = await userRepository.findByPhone(pool, normalizedPhone);
  if (existingPhone) throw new AppError(409, 'Phone number is already registered.', 'PHONE_TAKEN');

  // ADMIN_PHONE bootstrap (see config/env.js) - whoever registers with that
  // exact phone number becomes SUPER_ADMIN immediately, no manual SQL
  // needed. An already-registered match is instead caught by the startup
  // check in server.js.
  const adminPhone = env.admin.phone ? normalizePhone(env.admin.phone) : null;
  const role = adminPhone && normalizedPhone === adminPhone ? 'SUPER_ADMIN' : 'USER';

  let referredBy = null;
  let usedReferralCode = null;
  if (referralCode) {
    usedReferralCode = referralCode.trim().toUpperCase();
    const referrer = await userRepository.findByReferralCode(pool, usedReferralCode);
    if (!referrer) throw new AppError(400, 'Referral code is invalid.', 'INVALID_REFERRAL_CODE');
    referredBy = referrer.id;
  }

  const passwordHash = await hashPassword(password);
  const newReferralCode = await generateUniqueReferralCode();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = await userRepository.createUser(connection, {
      fullName: fullName.trim(),
      phone: normalizedPhone,
      passwordHash,
      referralCode: newReferralCode,
      referredBy,
      role,
    });
    await walletRepository.createWallet(connection, userId);

    // Referrer is locked in permanently at registration - no code path
    // ever updates users.referred_by afterward (PMD section 24).
    if (referredBy) {
      await referralRepository.create(connection, {
        referrerId: referredBy,
        referredUserId: userId,
        referralCode: usedReferralCode,
      });
    }

    await connection.commit();

    const user = await userRepository.findById(pool, userId);
    return userRepository.sanitizeUser(user);
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'Phone number or referral code is already in use.', 'DUPLICATE_ENTRY');
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function login({ phone, password }) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new AppError(400, 'Enter a valid Pakistani mobile number.', 'INVALID_PHONE');
  }

  const user = await userRepository.findByPhone(pool, normalizedPhone);
  if (!user) {
    logger.warn('AUTH_LOGIN_FAILED', { phone: normalizedPhone, reason: 'NO_SUCH_USER' });
    throw new AppError(401, 'Invalid phone number or password.', 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await comparePassword(password, user.password_hash);
  if (!passwordMatches) {
    logger.warn('AUTH_LOGIN_FAILED', { phone: normalizedPhone, reason: 'BAD_PASSWORD' });
    throw new AppError(401, 'Invalid phone number or password.', 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'ACTIVE') {
    logger.warn('AUTH_LOGIN_FAILED', { phone: normalizedPhone, reason: `ACCOUNT_${user.status}` });
    throw new AppError(403, STATUS_MESSAGES[user.status] || 'Account is not active.', 'ACCOUNT_NOT_ACTIVE');
  }

  await userRepository.updateLastLogin(pool, user.id);
  const token = signToken({ sub: user.id, tv: user.token_version });

  return { token, user: userRepository.sanitizeUser(user) };
}

async function logout(userId) {
  await userRepository.incrementTokenVersion(pool, userId);
}

async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await userRepository.findById(pool, userId);
  if (!user) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');

  const passwordMatches = await comparePassword(currentPassword, user.password_hash);
  if (!passwordMatches) throw new AppError(400, 'Current password is incorrect.', 'INVALID_CURRENT_PASSWORD');

  const newHash = await hashPassword(newPassword);
  await userRepository.updatePasswordHash(pool, userId, newHash);
  await userRepository.incrementTokenVersion(pool, userId);
}

async function requestPasswordReset({ phone }) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return; // do not reveal whether the phone number is registered

  const user = await userRepository.findByPhone(pool, normalizedPhone);
  if (!user) return; // do not reveal whether the phone number is registered

  await passwordResetTokenRepository.deleteAllForUser(pool, user.id);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + env.auth.resetTokenExpiryMinutes * 60 * 1000);

  await passwordResetTokenRepository.create(pool, { userId: user.id, tokenHash, expiresAt });

  const resetUrl = `${env.appUrl}/reset-password?token=${rawToken}`;
  const message = `Reset your password (valid for ${env.auth.resetTokenExpiryMinutes} minutes): ${resetUrl}`;
  const result = await smsService.sendSms(user.phone, message);
  if (!result.sent) {
    logger.warn('PASSWORD_RESET_SMS_NOT_DELIVERED', { userId: user.id, reason: result.reason });
  }
}

async function confirmPasswordReset({ token, newPassword }) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetToken = await passwordResetTokenRepository.findValidByHash(pool, tokenHash);
  if (!resetToken) throw new AppError(400, 'Invalid or expired reset token.', 'INVALID_RESET_TOKEN');

  const newHash = await hashPassword(newPassword);
  await userRepository.updatePasswordHash(pool, resetToken.user_id, newHash);
  await userRepository.incrementTokenVersion(pool, resetToken.user_id);
  await passwordResetTokenRepository.markUsed(pool, resetToken.id);
}

module.exports = {
  register, login, logout, changePassword, requestPasswordReset, confirmPasswordReset,
};
