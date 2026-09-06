const referralService = require('../services/referral.service');
const env = require('../config/env');

async function listReferrals(req, res, next) {
  try {
    const { page, pageSize } = req.validated.query;
    const result = await referralService.listReferrals(req.user.id, { page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await referralService.getReferralStats(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        stats: {
          referralCode: req.user.referralCode,
          referralLink: `${env.appUrl}/register?ref=${req.user.referralCode}`,
          ...stats,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listReferrals, getStats };
