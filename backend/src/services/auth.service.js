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
const mailService = require('./mail.service');
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
  fullName, email, phone, password, referralCode,
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new AppError(400, 'Enter a valid Pakistani mobile number.', 'INVALID_PHONE');
  }

  const [existingEmail, existingPhone] = await Promise.all([
    userRepository.findByEmail(pool, normalizedEmail),
    userRepository.findByPhone(pool, normalizedPhone),
  ]);
  if (existingEmail) throw new AppError(409, 'Email is already registered.', 'EMAIL_TAKEN');
  if (existingPhone) throw new AppError(409, 'Phone number is already registered.', 'PHONE_TAKEN');

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
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      referralCode: newReferralCode,
      referredBy,
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
      throw new AppError(409, 'Email, phone, or referral code is already in use.', 'DUPLICATE_ENTRY');
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await userRepository.findByEmail(pool, normalizedEmail);
  if (!user) {
    logger.warn('AUTH_LOGIN_FAILED', { email: normalizedEmail, reason: 'NO_SUCH_USER' });
    throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await comparePassword(password, user.password_hash);
  if (!passwordMatches) {
    logger.warn('AUTH_LOGIN_FAILED', { email: normalizedEmail, reason: 'BAD_PASSWORD' });
    throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'ACTIVE') {
    logger.warn('AUTH_LOGIN_FAILED', { email: normalizedEmail, reason: `ACCOUNT_${user.status}` });
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

async function requestPasswordReset({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await userRepository.findByEmail(pool, normalizedEmail);
  if (!user) return; // do not reveal whether the email is registered

  await passwordResetTokenRepository.deleteAllForUser(pool, user.id);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + env.auth.resetTokenExpiryMinutes * 60 * 1000);

  await passwordResetTokenRepository.create(pool, { userId: user.id, tokenHash, expiresAt });

  const resetUrl = `${env.appUrl}/reset-password?token=${rawToken}`;
  await mailService.sendPasswordResetEmail(user.email, resetUrl);
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
