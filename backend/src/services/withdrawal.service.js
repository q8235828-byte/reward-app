const pool = require('../config/database');
const withdrawalRepository = require('../repositories/withdrawal.repository');
const walletTransactionRepository = require('../repositories/walletTransaction.repository');
const walletService = require('./wallet.service');
const settingsService = require('./settings.service');
const auditLogService = require('./auditLog.service');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const { toDecimal } = require('../utils/money');
const { normalizePhone } = require('../utils/phone');

const DAY_MS = 24 * 60 * 60 * 1000;

// userId/userCreatedAt come from the already-authenticated req.user (Phase
// 3's authenticate middleware re-loads it fresh from the DB every request),
// so "user exists" / "user is ACTIVE" (PMD section 21, checks 1-2) are
// already guaranteed before this function runs.
async function createWithdrawal({
  userId, userCreatedAt, amount, paymentMethod, accountName, accountNumber,
}) {
  const normalizedAccountNumber = normalizePhone(accountNumber);
  if (!normalizedAccountNumber) {
    throw new AppError(400, 'Enter a valid Pakistani mobile account number.', 'INVALID_ACCOUNT_NUMBER');
  }

  const [minAccountAgeDays, minWithdrawal, maxWithdrawal] = await Promise.all([
    settingsService.getNumber('withdrawal_min_account_age_days', 14),
    settingsService.getNumber('minimum_withdrawal', 500),
    settingsService.getNumber('maximum_withdrawal', 25000),
  ]);

  // Check 3: 14-day (configurable) account age rule.
  const accountAgeDays = (Date.now() - new Date(userCreatedAt).getTime()) / DAY_MS;
  if (accountAgeDays < minAccountAgeDays) {
    const remainingDays = Math.max(1, Math.ceil(minAccountAgeDays - accountAgeDays));
    throw new AppError(
      403,
      `Withdrawals become available in ${remainingDays} day(s) (accounts must be at least ${minAccountAgeDays} days old).`,
      'ACCOUNT_TOO_NEW',
    );
  }

  // Check 4: amount bounds.
  const amountDecimal = toDecimal(amount);
  if (amountDecimal.lte(minWithdrawal)) {
    throw new AppError(400, `Amount must be greater than ${minWithdrawal}.`, 'AMOUNT_TOO_LOW');
  }
  if (amountDecimal.gt(maxWithdrawal)) {
    throw new AppError(400, `Amount must not exceed ${maxWithdrawal}.`, 'AMOUNT_TOO_HIGH');
  }

  // Check 6: no conflicting pending/processing withdrawal.
  const hasActive = await withdrawalRepository.hasActiveForUser(pool, userId);
  if (hasActive) {
    throw new AppError(409, 'You already have a pending withdrawal request.', 'WITHDRAWAL_IN_PROGRESS');
  }

  // Check 5 (amount <= withdrawable balance) is enforced atomically by
  // WalletService.debitWithdrawal below, under a row lock - safer than a
  // separate pre-check, which would leave a race window.
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const withdrawalId = await withdrawalRepository.create(connection, {
      userId, amount, paymentMethod, accountName, accountNumber: normalizedAccountNumber, status: 'PENDING',
    });

    // Reserve/deduct immediately so a second request can't be created
    // against the same balance while this one is still pending.
    await walletService.debitWithdrawal(connection, {
      userId,
      amount,
      reference: `WITHDRAWAL-${withdrawalId}`,
      description: `Withdrawal #${withdrawalId} requested.`,
    });

    await connection.commit();
    logger.info('WITHDRAWAL_CREATED', {
      withdrawalId, userId, amount, paymentMethod,
    });

    const withdrawal = await withdrawalRepository.findById(pool, withdrawalId);
    return withdrawalRepository.sanitizeWithdrawal(withdrawal);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getUserWithdrawals(userId, { status, page, pageSize }) {
  const [items, total] = await Promise.all([
    withdrawalRepository.listByUser(pool, userId, { status, page, pageSize }),
    withdrawalRepository.countByUser(pool, userId, { status }),
  ]);
  return {
    items: items.map(withdrawalRepository.sanitizeWithdrawal),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

async function getUserWithdrawalById(userId, withdrawalId) {
  const withdrawal = await withdrawalRepository.findById(pool, withdrawalId);
  if (!withdrawal || withdrawal.user_id !== userId) {
    throw new AppError(404, 'Withdrawal not found.', 'WITHDRAWAL_NOT_FOUND');
  }
  return withdrawalRepository.sanitizeWithdrawal(withdrawal);
}

// --- Admin-facing business logic (Phase 11: routes/authorization/audit
// logging now wired in, same as DepositService's approve/reject). ---

async function listAllWithdrawals({ status, page, pageSize }) {
  const [items, total] = await Promise.all([
    withdrawalRepository.listAll(pool, { status, page, pageSize }),
    withdrawalRepository.countAll(pool, { status }),
  ]);
  return {
    items: items.map(withdrawalRepository.sanitizeWithdrawal),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

async function refundReservedAmount(conn, withdrawal, note) {
  const originalTx = await walletTransactionRepository.findByReference(conn, `WITHDRAWAL-${withdrawal.id}`);
  if (!originalTx) return; // nothing was ever reserved - shouldn't happen, but don't crash on it
  await walletService.reverseTransaction(conn, {
    originalTransactionId: originalTx.id,
    description: note || `Withdrawal #${withdrawal.id} rejected - funds returned.`,
  });
}

async function approveWithdrawal({
  withdrawalId, adminId, note, ipAddress,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const withdrawal = await withdrawalRepository.getForUpdate(connection, withdrawalId);
    if (!withdrawal) throw new AppError(404, 'Withdrawal not found.', 'WITHDRAWAL_NOT_FOUND');
    if (withdrawal.status === 'APPROVED') {
      await connection.commit();
      return withdrawalRepository.sanitizeWithdrawal(withdrawal);
    }
    if (withdrawal.status !== 'PENDING') {
      throw new AppError(400, `Cannot approve a withdrawal with status ${withdrawal.status}.`, 'INVALID_WITHDRAWAL_STATUS');
    }

    await withdrawalRepository.updateStatus(connection, withdrawalId, {
      status: 'APPROVED', adminNote: note || null, processedBy: adminId, processedAt: new Date(),
    });

    await auditLogService.log(connection, {
      adminId,
      action: 'WITHDRAWAL_APPROVED',
      targetType: 'withdrawal',
      targetId: withdrawalId,
      previousValue: { status: withdrawal.status },
      newValue: { status: 'APPROVED', note: note || null },
      ipAddress,
    });

    await connection.commit();
    logger.info('WITHDRAWAL_APPROVED', { withdrawalId, adminId, userId: withdrawal.user_id });
    const updated = await withdrawalRepository.findById(pool, withdrawalId);
    return withdrawalRepository.sanitizeWithdrawal(updated);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function markProcessing({
  withdrawalId, adminId, note, ipAddress,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const withdrawal = await withdrawalRepository.getForUpdate(connection, withdrawalId);
    if (!withdrawal) throw new AppError(404, 'Withdrawal not found.', 'WITHDRAWAL_NOT_FOUND');
    if (withdrawal.status === 'PROCESSING') {
      await connection.commit();
      return withdrawalRepository.sanitizeWithdrawal(withdrawal);
    }
    if (withdrawal.status !== 'APPROVED') {
      throw new AppError(400, `Cannot mark processing a withdrawal with status ${withdrawal.status}.`, 'INVALID_WITHDRAWAL_STATUS');
    }

    await withdrawalRepository.updateStatus(connection, withdrawalId, {
      status: 'PROCESSING',
      adminNote: note || withdrawal.admin_note,
      processedBy: adminId,
      processedAt: withdrawal.processed_at || new Date(),
    });

    await auditLogService.log(connection, {
      adminId,
      action: 'WITHDRAWAL_PROCESSING',
      targetType: 'withdrawal',
      targetId: withdrawalId,
      previousValue: { status: withdrawal.status },
      newValue: { status: 'PROCESSING', note: note || null },
      ipAddress,
    });

    await connection.commit();
    const updated = await withdrawalRepository.findById(pool, withdrawalId);
    return withdrawalRepository.sanitizeWithdrawal(updated);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Funds were already debited when the withdrawal was requested - marking
// paid only confirms the transfer went out, it does not move money again.
async function markPaid({
  withdrawalId, adminId, note, ipAddress,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const withdrawal = await withdrawalRepository.getForUpdate(connection, withdrawalId);
    if (!withdrawal) throw new AppError(404, 'Withdrawal not found.', 'WITHDRAWAL_NOT_FOUND');
    if (withdrawal.status === 'PAID') {
      await connection.commit();
      return withdrawalRepository.sanitizeWithdrawal(withdrawal);
    }
    if (!['APPROVED', 'PROCESSING'].includes(withdrawal.status)) {
      throw new AppError(400, `Cannot mark paid a withdrawal with status ${withdrawal.status}.`, 'INVALID_WITHDRAWAL_STATUS');
    }

    await withdrawalRepository.updateStatus(connection, withdrawalId, {
      status: 'PAID', adminNote: note || withdrawal.admin_note, processedBy: adminId, processedAt: new Date(),
    });

    await auditLogService.log(connection, {
      adminId,
      action: 'WITHDRAWAL_PAID',
      targetType: 'withdrawal',
      targetId: withdrawalId,
      previousValue: { status: withdrawal.status },
      newValue: { status: 'PAID', note: note || null },
      ipAddress,
    });

    await connection.commit();
    logger.info('WITHDRAWAL_PAID', { withdrawalId, adminId, userId: withdrawal.user_id, amount: withdrawal.amount });
    const updated = await withdrawalRepository.findById(pool, withdrawalId);
    return withdrawalRepository.sanitizeWithdrawal(updated);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function rejectWithdrawal({
  withdrawalId, adminId, note, ipAddress,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const withdrawal = await withdrawalRepository.getForUpdate(connection, withdrawalId);
    if (!withdrawal) throw new AppError(404, 'Withdrawal not found.', 'WITHDRAWAL_NOT_FOUND');
    if (withdrawal.status === 'REJECTED') {
      await connection.commit();
      return withdrawalRepository.sanitizeWithdrawal(withdrawal);
    }
    if (!['PENDING', 'APPROVED', 'PROCESSING'].includes(withdrawal.status)) {
      throw new AppError(400, `Cannot reject a withdrawal with status ${withdrawal.status}.`, 'INVALID_WITHDRAWAL_STATUS');
    }

    await refundReservedAmount(connection, withdrawal, note);

    await withdrawalRepository.updateStatus(connection, withdrawalId, {
      status: 'REJECTED', adminNote: note || null, processedBy: adminId, processedAt: new Date(),
    });

    await auditLogService.log(connection, {
      adminId,
      action: 'WITHDRAWAL_REJECTED',
      targetType: 'withdrawal',
      targetId: withdrawalId,
      previousValue: { status: withdrawal.status },
      newValue: { status: 'REJECTED', note: note || null },
      ipAddress,
    });

    await connection.commit();
    logger.info('WITHDRAWAL_REJECTED', { withdrawalId, adminId, userId: withdrawal.user_id });
    const updated = await withdrawalRepository.findById(pool, withdrawalId);
    return withdrawalRepository.sanitizeWithdrawal(updated);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createWithdrawal,
  getUserWithdrawals,
  getUserWithdrawalById,
  listAllWithdrawals,
  approveWithdrawal,
  markProcessing,
  markPaid,
  rejectWithdrawal,
};
