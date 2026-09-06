const withdrawalService = require('../services/withdrawal.service');
const AppError = require('../utils/AppError');

function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'Invalid withdrawal id.', 'INVALID_ID');
  }
  return id;
}

async function listWithdrawals(req, res, next) {
  try {
    const { status, page, pageSize } = req.validated.query;
    const result = await withdrawalService.listAllWithdrawals({ status, page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function approveWithdrawal(req, res, next) {
  try {
    const withdrawalId = parseId(req.params.id);
    const withdrawal = await withdrawalService.approveWithdrawal({
      withdrawalId, adminId: req.user.id, note: req.body.note, ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'Withdrawal approved.', data: { withdrawal } });
  } catch (error) {
    next(error);
  }
}

async function markProcessing(req, res, next) {
  try {
    const withdrawalId = parseId(req.params.id);
    const withdrawal = await withdrawalService.markProcessing({
      withdrawalId, adminId: req.user.id, note: req.body.note, ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'Withdrawal marked as processing.', data: { withdrawal } });
  } catch (error) {
    next(error);
  }
}

async function markPaid(req, res, next) {
  try {
    const withdrawalId = parseId(req.params.id);
    const withdrawal = await withdrawalService.markPaid({
      withdrawalId, adminId: req.user.id, note: req.body.note, ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'Withdrawal marked as paid.', data: { withdrawal } });
  } catch (error) {
    next(error);
  }
}

async function rejectWithdrawal(req, res, next) {
  try {
    const withdrawalId = parseId(req.params.id);
    const withdrawal = await withdrawalService.rejectWithdrawal({
      withdrawalId, adminId: req.user.id, note: req.body.note, ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'Withdrawal rejected.', data: { withdrawal } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listWithdrawals, approveWithdrawal, markProcessing, markPaid, rejectWithdrawal,
};
