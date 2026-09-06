const withdrawalService = require('../services/withdrawal.service');
const AppError = require('../utils/AppError');

function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'Invalid withdrawal id.', 'INVALID_ID');
  }
  return id;
}

async function createWithdrawal(req, res, next) {
  try {
    const withdrawal = await withdrawalService.createWithdrawal({
      userId: req.user.id,
      userCreatedAt: req.user.createdAt,
      ...req.body,
    });
    res.status(201).json({ success: true, message: 'Withdrawal request created.', data: { withdrawal } });
  } catch (error) {
    next(error);
  }
}

async function listWithdrawals(req, res, next) {
  try {
    const {
      status, page, pageSize,
    } = req.validated.query;
    const result = await withdrawalService.getUserWithdrawals(req.user.id, { status, page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getWithdrawal(req, res, next) {
  try {
    const withdrawalId = parseId(req.params.id);
    const withdrawal = await withdrawalService.getUserWithdrawalById(req.user.id, withdrawalId);
    res.status(200).json({ success: true, data: { withdrawal } });
  } catch (error) {
    next(error);
  }
}

module.exports = { createWithdrawal, listWithdrawals, getWithdrawal };
