const pool = require('../config/database');
const referralRepository = require('../repositories/referral.repository');
const referralCommissionRepository = require('../repositories/referralCommission.repository');
const userRepository = require('../repositories/user.repository');
const walletService = require('./wallet.service');
const settingsService = require('./settings.service');
const { toDecimal } = require('../utils/money');
const logger = require('../utils/logger');

// Matches the DEFAULT on referral_commissions.commission_type - the only
// qualifying event currently implemented is an approved deposit from a
// referred user. A different event type could be added later without
// touching this constant's callers, since idempotency is keyed on
// (source_transaction_id, commission_type).
const COMMISSION_TYPE = 'DEPOSIT';

// Called by DepositService.approveDeposit inside the same DB transaction,
// right after the deposit's wallet credit. No-ops if the depositor has no
// referrer. Idempotent per deposit (source_transaction_id + commission_type).
async function processReferralCommission(conn, { depositorUserId, depositAmount, depositWalletTransactionId }) {
  const depositor = await userRepository.findById(conn, depositorUserId);
  if (!depositor || !depositor.referred_by) return null;

  const existing = await referralCommissionRepository.findBySource(conn, depositWalletTransactionId, COMMISSION_TYPE);
  if (existing) return existing;

  const referrerId = depositor.referred_by;

  const [baseRate, threshold, bonusEnabled, bonusRate] = await Promise.all([
    settingsService.getNumber('referral_commission_rate', 10),
    settingsService.getNumber('referral_threshold', 5),
    settingsService.getBoolean('bonus_enabled', false),
    settingsService.getNumber('bonus_commission_rate', 0),
  ]);

  let effectiveRate = toDecimal(baseRate);
  if (bonusEnabled) {
    const qualifiedCount = await referralRepository.countQualifiedByReferrer(conn, referrerId);
    if (qualifiedCount >= threshold) {
      effectiveRate = effectiveRate.plus(bonusRate);
    }
  }

  const commissionAmount = toDecimal(depositAmount).times(effectiveRate).dividedBy(100);
  if (commissionAmount.lte(0)) return null;

  const walletTransaction = await walletService.creditReferralCommission(conn, {
    userId: referrerId,
    amount: commissionAmount,
    reference: `REFCOMM-${depositWalletTransactionId}`,
    description: `Referral commission from user #${depositorUserId}'s deposit.`,
  });

  const commissionId = await referralCommissionRepository.create(conn, {
    referrerId,
    referredUserId: depositorUserId,
    sourceTransactionId: depositWalletTransactionId,
    commissionType: COMMISSION_TYPE,
    rate: effectiveRate.toFixed(4),
    amount: commissionAmount.toFixed(2),
    status: 'PAID',
  });

  logger.info('REFERRAL_COMMISSION_CREDITED', {
    commissionId, referrerId, referredUserId: depositorUserId, amount: commissionAmount.toFixed(2),
  });

  // First approved deposit is what makes this referral "qualifying" -
  // later deposits from the same user still pay commission but don't
  // need to re-trigger the status transition.
  const referral = await referralRepository.findByReferredUserId(conn, depositorUserId);
  if (referral && referral.status === 'NOT_QUALIFIED') {
    await referralRepository.markQualified(conn, referral.id);
  }

  return { id: commissionId, walletTransaction };
}

async function listReferrals(userId, { page = 1, pageSize = 20 } = {}) {
  const [items, total] = await Promise.all([
    referralRepository.listByReferrer(pool, userId, { page, pageSize }),
    referralRepository.countByReferrer(pool, userId),
  ]);
  return {
    items: items.map(referralRepository.sanitizeReferral),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

async function getReferralStats(userId) {
  const [totalReferrals, qualifiedReferrals, threshold, bonusEnabled, totalEarnings] = await Promise.all([
    referralRepository.countByReferrer(pool, userId),
    referralRepository.countQualifiedByReferrer(pool, userId),
    settingsService.getNumber('referral_threshold', 5),
    settingsService.getBoolean('bonus_enabled', false),
    referralCommissionRepository.sumByReferrer(pool, userId),
  ]);

  return {
    totalReferrals,
    qualifiedReferrals,
    referralThreshold: threshold,
    achievementQualified: qualifiedReferrals >= threshold,
    bonusEnabled,
    totalReferralEarnings: totalEarnings,
  };
}

// Admin view - across every referrer, unlike listReferrals (one referrer).
async function listAllReferrals({ status, page = 1, pageSize = 20 }) {
  const [items, total] = await Promise.all([
    referralRepository.listAllAdmin(pool, {
      status, page, pageSize,
    }),
    referralRepository.countAllAdmin(pool, { status }),
  ]);
  return {
    items: items.map(referralRepository.sanitizeReferralAdmin),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

module.exports = {
  processReferralCommission, listReferrals, getReferralStats, listAllReferrals,
};
