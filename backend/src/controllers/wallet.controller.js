const walletService = require('../services/wallet.service');

async function getWallet(req, res, next) {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.id);
    res.status(200).json({ success: true, data: { wallet } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getWallet };
