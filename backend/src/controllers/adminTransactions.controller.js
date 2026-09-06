const walletService = require('../services/wallet.service');

async function listTransactions(req, res, next) {
  try {
    const {
      type, status, page, pageSize,
    } = req.validated.query;
    const result = await walletService.listAllTransactions({
      type, status, page, pageSize,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = { listTransactions };
