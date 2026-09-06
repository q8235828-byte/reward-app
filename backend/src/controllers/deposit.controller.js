const depositService = require('../services/deposit.service');
const AppError = require('../utils/AppError');

function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'Invalid deposit id.', 'INVALID_ID');
  }
  return id;
}

async function createDeposit(req, res, next) {
  try {
    const result = await depositService.createDeposit({ userId: req.user.id, ...req.body });
    res.status(201).json({ success: true, message: 'Deposit request created.', data: result });
  } catch (error) {
    next(error);
  }
}

async function submitReference(req, res, next) {
  try {
    const depositId = parseId(req.params.id);
    const deposit = await depositService.submitTransactionReference({
      userId: req.user.id,
      depositId,
      transactionReference: req.body.transactionReference,
    });
    res.status(200).json({
      success: true,
      message: 'Transaction reference submitted. Your deposit is now under review.',
      data: { deposit },
    });
  } catch (error) {
    next(error);
  }
}

async function listDeposits(req, res, next) {
  try {
    const {
      status, page, pageSize,
    } = req.validated.query;
    const result = await depositService.getUserDeposits(req.user.id, { status, page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getDeposit(req, res, next) {
  try {
    const depositId = parseId(req.params.id);
    const deposit = await depositService.getUserDepositById(req.user.id, depositId);
    res.status(200).json({ success: true, data: { deposit } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDeposit, submitReference, listDeposits, getDeposit,
};
