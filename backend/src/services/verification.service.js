const crypto = require('crypto');
const pool = require('../config/database');
const verificationCodeRepository = require('../repositories/verificationCode.repository');
const userRepository = require('../repositories/user.repository');
const mailService = require('./mail.service');
const smsService = require('./sms.service');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const logger = require('../utils/logger');

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function requestCode({ userId, channel, destination }) {
  const latest = await verificationCodeRepository.findLatestActive(pool, userId, channel);
  if (latest) {
    const ageSeconds = (Date.now() - new Date(latest.created_at).getTime()) / 1000;
    if (ageSeconds < env.verification.resendCooldownSeconds) {
      const wait = Math.ceil(env.verification.resendCooldownSeconds - ageSeconds);
      throw new AppError(429, `Please wait ${wait}s before requesting another code.`, 'VERIFICATION_COOLDOWN');
    }
  }

  // Only one active code per channel at a time.
  await verificationCodeRepository.invalidateActive(pool, userId, channel);

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + env.verification.codeExpiryMinutes * 60 * 1000);

  await verificationCodeRepository.create(pool, {
    userId, channel, codeHash, expiresAt,
  });

  if (channel === 'EMAIL') {
    await mailService.sendVerificationCodeEmail(destination, code, env.verification.codeExpiryMinutes);
  } else {
    const message = `Your verification code is ${code}. It expires in ${env.verification.codeExpiryMinutes} minutes.`;
    const result = await smsService.sendSms(destination, message);
    if (!result.sent) {
      logger.warn('SMS_VERIFICATION_NOT_DELIVERED', { userId, reason: result.reason });
    }
  }
}

async function confirmCode({ userId, channel, code }) {
  const codeHash = hashCode(code);
  const record = await verificationCodeRepository.findValidByHash(pool, userId, channel, codeHash);

  if (!record) {
    // Track the wrong guess against whatever code is currently active, so
    // repeated incorrect attempts eventually lock it out too.
    const latest = await verificationCodeRepository.findLatestActive(pool, userId, channel);
    if (latest) {
      await verificationCodeRepository.incrementAttempts(pool, latest.id);
      if (latest.attempts + 1 >= env.verification.maxAttempts) {
        await verificationCodeRepository.markUsed(pool, latest.id);
        throw new AppError(429, 'Too many incorrect attempts. Request a new code.', 'VERIFICATION_LOCKED');
      }
    }
    throw new AppError(400, 'Invalid or expired code.', 'INVALID_VERIFICATION_CODE');
  }

  if (record.attempts >= env.verification.maxAttempts) {
    await verificationCodeRepository.markUsed(pool, record.id);
    throw new AppError(429, 'Too many incorrect attempts. Request a new code.', 'VERIFICATION_LOCKED');
  }

  await verificationCodeRepository.markUsed(pool, record.id);

  if (channel === 'EMAIL') {
    await userRepository.markEmailVerified(pool, userId);
  } else {
    await userRepository.markPhoneVerified(pool, userId);
  }
}

module.exports = { requestCode, confirmCode };
