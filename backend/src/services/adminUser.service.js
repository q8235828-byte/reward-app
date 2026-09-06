const pool = require('../config/database');
const userRepository = require('../repositories/user.repository');
const walletRepository = require('../repositories/wallet.repository');
const walletService = require('./wallet.service');
const auditLogService = require('./auditLog.service');
const AppError = require('../utils/AppError');

const ADMIN_SETTABLE_STATUSES = ['ACTIVE', 'SUSPENDED', 'BLOCKED'];
const STATUS_AUDIT_ACTIONS = {
  ACTIVE: 'USER_ACTIVATED',
  SUSPENDED: 'USER_SUSPENDED',
  BLOCKED: 'USER_BLOCKED',
};

async function listUsers({
  search, status, page = 1, pageSize = 20,
}) {
  const [items, total] = await Promise.all([
    userRepository.search(pool, {
      search, status, page, pageSize,
    }),
    userRepository.count(pool, { search, status }),
  ]);
  return {
    items: items.map(userRepository.sanitizeUser),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

// Wallet/deposits/withdrawals/referrals/transactions for one user are
// intentionally not duplicated here - WalletService, DepositService,
// WithdrawalService, and ReferralService already accept an arbitrary
// userId (not hardcoded to "self"), so the admin routes for those call
// straight into the same functions the user-facing routes use, just
// parameterized by :id instead of req.user.id.
async function getUserDetail(userId) {
  const user = await userRepository.findById(pool, userId);
  if (!user) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');
  const wallet = await walletRepository.getByUserId(pool, userId);
  return {
    user: userRepository.sanitizeUser(user),
    wallet: walletRepository.sanitizeWallet(wallet),
  };
}

async function updateUserStatus({
  userId, status, adminId, note, ipAddress,
}) {
  if (!ADMIN_SETTABLE_STATUSES.includes(status)) {
    throw new AppError(400, `Invalid status: ${status}.`, 'INVALID_STATUS');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const user = await userRepository.getForUpdate(connection, userId);
    if (!user) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');

    if (user.status === status) {
      await connection.commit();
      return userRepository.sanitizeUser(user);
    }

    await userRepository.updateStatus(connection, userId, status);

    await auditLogService.log(connection, {
      adminId,
      action: STATUS_AUDIT_ACTIONS[status],
      targetType: 'user',
      targetId: userId,
      previousValue: { status: user.status },
      newValue: { status, note: note || null },
      ipAddress,
    });

    await connection.commit();

    const updated = await userRepository.findById(pool, userId);
    return userRepository.sanitizeUser(updated);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// The one place admin can directly move a wallet balance outside the
// normal deposit/reward/referral/withdrawal flows (PMD section 11 - use an
// ADJUSTMENT ledger entry, never edit a balance silently). Closes the loop
// on WalletService.adjustBalance, built in Phase 4 with no caller until now.
async function adjustUserWallet({
  userId, field, amount, reason, adminId, ipAddress,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const user = await userRepository.findById(connection, userId);
    if (!user) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');

    const transaction = await walletService.adjustBalance(connection, {
      userId,
      field,
      amount,
      reference: `ADJ-${userId}-${Date.now()}`,
      description: reason,
    });

    await auditLogService.log(connection, {
      adminId,
      action: 'BALANCE_ADJUSTED',
      targetType: 'wallet',
      targetId: userId,
      previousValue: { field, balanceBefore: transaction.balanceBefore },
      newValue: {
        field, balanceAfter: transaction.balanceAfter, amount, reason,
      },
      ipAddress,
    });

    await connection.commit();
    return transaction;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listUsers, getUserDetail, updateUserStatus, adjustUserWallet,
};
