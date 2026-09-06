const adminUserService = require('../services/adminUser.service');
const walletService = require('../services/wallet.service');
const depositService = require('../services/deposit.service');
const withdrawalService = require('../services/withdrawal.service');
const referralService = require('../services/referral.service');
const AppError = require('../utils/AppError');

function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'Invalid user id.', 'INVALID_ID');
  }
  return id;
}

async function listUsers(req, res, next) {
  try {
    const {
      search, status, page, pageSize,
    } = req.validated.query;
    const result = await adminUserService.listUsers({
      search, status, page, pageSize,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const userId = parseId(req.params.id);
    const detail = await adminUserService.getUserDetail(userId);
    res.status(200).json({ success: true, data: detail });
  } catch (error) {
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const userId = parseId(req.params.id);
    const user = await adminUserService.updateUserStatus({
      userId,
      status: req.body.status,
      note: req.body.note,
      adminId: req.user.id,
      ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'User status updated.', data: { user } });
  } catch (error) {
    next(error);
  }
}

async function getUserWallet(req, res, next) {
  try {
    const userId = parseId(req.params.id);
    const wallet = await walletService.getWalletByUserId(userId);
    res.status(200).json({ success: true, data: { wallet } });
  } catch (error) {
    next(error);
  }
}

async function adjustUserWallet(req, res, next) {
  try {
    const userId = parseId(req.params.id);
    const transaction = await adminUserService.adjustUserWallet({
      userId,
      field: req.body.field,
      amount: req.body.amount,
      reason: req.body.reason,
      adminId: req.user.id,
      ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'Wallet adjusted.', data: { transaction } });
  } catch (error) {
    next(error);
  }
}

async function getUserTransactions(req, res, next) {
  try {
    const userId = parseId(req.params.id);
    const { type, status, page, pageSize } = req.validated.query;
    const result = await walletService.listTransactions(userId, {
      type, status, page, pageSize,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getUserDeposits(req, res, next) {
  try {
    const userId = parseId(req.params.id);
    const { status, page, pageSize } = req.validated.query;
    const result = await depositService.getUserDeposits(userId, { status, page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getUserWithdrawals(req, res, next) {
  try {
    const userId = parseId(req.params.id);
    const { status, page, pageSize } = req.validated.query;
    const result = await withdrawalService.getUserWithdrawals(userId, { status, page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getUserReferrals(req, res, next) {
  try {
    const userId = parseId(req.params.id);
    const { page, pageSize } = req.validated.query;
    const result = await referralService.listReferrals(userId, { page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  getUser,
  updateUserStatus,
  getUserWallet,
  adjustUserWallet,
  getUserTransactions,
  getUserDeposits,
  getUserWithdrawals,
  getUserReferrals,
};
