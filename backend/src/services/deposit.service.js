const pool = require('../config/database');
const depositRepository = require('../repositories/deposit.repository');
const userPlanRepository = require('../repositories/userPlan.repository');
const planService = require('./plan.service');
const walletService = require('./wallet.service');
const referralService = require('./referral.service');
const paymentService = require('./payment/paymentService');
const auditLogService = require('./auditLog.service');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

async function createDeposit({
  userId, planId, amount, paymentMethod, transactionReference, receiptImage,
}) {
  const plan = await planService.getActivePlanById(planId);
  planService.validateDepositAmount(plan, amount);

  const status = transactionReference ? 'UNDER_REVIEW' : 'PENDING';
  const depositId = await depositRepository.create(pool, {
    userId,
    planId,
    amount,
    paymentMethod,
    transactionReference: transactionReference || null,
    status,
    receiptImage: receiptImage || null,
  });

  logger.info('DEPOSIT_CREATED', {
    depositId, userId, planId, amount, paymentMethod,
  });

  const deposit = await depositRepository.findById(pool, depositId);
  return {
    deposit: depositRepository.sanitizeDeposit(deposit),
    paymentInstructions: paymentService.getPaymentInstructions(paymentMethod),
  };
}

async function submitTransactionReference({
  userId, depositId, transactionReference, receiptImage,
}) {
  const deposit = await depositRepository.findById(pool, depositId);
  if (!deposit || deposit.user_id !== userId) {
    throw new AppError(404, 'Deposit not found.', 'DEPOSIT_NOT_FOUND');
  }
  if (!['PENDING', 'UNDER_REVIEW'].includes(deposit.status)) {
    throw new AppError(400, 'This deposit can no longer be updated.', 'DEPOSIT_NOT_EDITABLE');
  }

  await depositRepository.updateTransactionReference(
    pool, depositId, transactionReference, 'UNDER_REVIEW', receiptImage,
  );
  const updated = await depositRepository.findById(pool, depositId);
  return depositRepository.sanitizeDeposit(updated);
}

async function getUserDeposits(userId, { status, page, pageSize }) {
  const [items, total] = await Promise.all([
    depositRepository.listByUser(pool, userId, { status, page, pageSize }),
    depositRepository.countByUser(pool, userId, { status }),
  ]);
  return {
    items: items.map(depositRepository.sanitizeDeposit),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

async function getUserDepositById(userId, depositId) {
  const deposit = await depositRepository.findById(pool, depositId);
  if (!deposit || deposit.user_id !== userId) {
    throw new AppError(404, 'Deposit not found.', 'DEPOSIT_NOT_FOUND');
  }
  return depositRepository.sanitizeDeposit(deposit);
}

// --- Admin-facing business logic (Phase 11: routes/authorization/audit
// logging now wired in). ---

async function listAllDeposits({ status, page, pageSize }) {
  const [items, total] = await Promise.all([
    depositRepository.listAll(pool, { status, page, pageSize }),
    depositRepository.countAll(pool, { status }),
  ]);
  return {
    items: items.map(depositRepository.sanitizeDeposit),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

async function approveDeposit({
  depositId, adminId, note, ipAddress,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const deposit = await depositRepository.getForUpdate(connection, depositId);
    if (!deposit) throw new AppError(404, 'Deposit not found.', 'DEPOSIT_NOT_FOUND');

    if (deposit.status === 'APPROVED') {
      await connection.commit();
      return depositRepository.sanitizeDeposit(deposit);
    }
    if (!['PENDING', 'UNDER_REVIEW'].includes(deposit.status)) {
      throw new AppError(400, `Cannot approve a deposit with status ${deposit.status}.`, 'INVALID_DEPOSIT_STATUS');
    }

    await depositRepository.updateStatus(connection, depositId, {
      status: 'APPROVED', adminNote: note || null, verifiedBy: adminId, verifiedAt: new Date(),
    });

    const depositTransaction = await walletService.creditDeposit(connection, {
      userId: deposit.user_id,
      amount: deposit.amount,
      reference: `DEPOSIT-${deposit.id}`,
      description: `Deposit #${deposit.id} approved (plan #${deposit.plan_id}).`,
    });

    await userPlanRepository.create(connection, {
      userId: deposit.user_id,
      planId: deposit.plan_id,
      amount: deposit.amount,
      status: 'ACTIVE',
      startedAt: new Date(),
    });

    await referralService.processReferralCommission(connection, {
      depositorUserId: deposit.user_id,
      depositAmount: deposit.amount,
      depositWalletTransactionId: depositTransaction.id,
    });

    await auditLogService.log(connection, {
      adminId,
      action: 'DEPOSIT_APPROVED',
      targetType: 'deposit',
      targetId: depositId,
      previousValue: { status: deposit.status },
      newValue: { status: 'APPROVED', note: note || null },
      ipAddress,
    });

    await connection.commit();
    logger.info('DEPOSIT_APPROVED', { depositId, adminId, userId: deposit.user_id, amount: deposit.amount });

    const updated = await depositRepository.findById(pool, depositId);
    return depositRepository.sanitizeDeposit(updated);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function rejectDeposit({
  depositId, adminId, note, ipAddress,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const deposit = await depositRepository.getForUpdate(connection, depositId);
    if (!deposit) throw new AppError(404, 'Deposit not found.', 'DEPOSIT_NOT_FOUND');
    if (deposit.status === 'REJECTED') {
      await connection.commit();
      return depositRepository.sanitizeDeposit(deposit);
    }
    if (!['PENDING', 'UNDER_REVIEW'].includes(deposit.status)) {
      throw new AppError(400, `Cannot reject a deposit with status ${deposit.status}.`, 'INVALID_DEPOSIT_STATUS');
    }

    await depositRepository.updateStatus(connection, depositId, {
      status: 'REJECTED', adminNote: note || null, verifiedBy: adminId, verifiedAt: new Date(),
    });

    await auditLogService.log(connection, {
      adminId,
      action: 'DEPOSIT_REJECTED',
      targetType: 'deposit',
      targetId: depositId,
      previousValue: { status: deposit.status },
      newValue: { status: 'REJECTED', note: note || null },
      ipAddress,
    });

    await connection.commit();
    logger.info('DEPOSIT_REJECTED', { depositId, adminId, userId: deposit.user_id });

    const updated = await depositRepository.findById(pool, depositId);
    return depositRepository.sanitizeDeposit(updated);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createDeposit,
  submitTransactionReference,
  getUserDeposits,
  getUserDepositById,
  listAllDeposits,
  approveDeposit,
  rejectDeposit,
};
