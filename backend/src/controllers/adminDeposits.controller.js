const depositService = require('../services/deposit.service');
const AppError = require('../utils/AppError');

function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'Invalid deposit id.', 'INVALID_ID');
  }
  return id;
}

async function listDeposits(req, res, next) {
  try {
    const { status, page, pageSize } = req.validated.query;
    const result = await depositService.listAllDeposits({ status, page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function approveDeposit(req, res, next) {
  try {
    const depositId = parseId(req.params.id);
    const deposit = await depositService.approveDeposit({
      depositId, adminId: req.user.id, note: req.body.note, ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'Deposit approved.', data: { deposit } });
  } catch (error) {
    next(error);
  }
}

async function rejectDeposit(req, res, next) {
  try {
    const depositId = parseId(req.params.id);
    const deposit = await depositService.rejectDeposit({
      depositId, adminId: req.user.id, note: req.body.note, ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'Deposit rejected.', data: { deposit } });
  } catch (error) {
    next(error);
  }
}

module.exports = { listDeposits, approveDeposit, rejectDeposit };
