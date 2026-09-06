const referralService = require('../services/referral.service');

async function listReferrals(req, res, next) {
  try {
    const { status, page, pageSize } = req.validated.query;
    const result = await referralService.listAllReferrals({ status, page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = { listReferrals };
