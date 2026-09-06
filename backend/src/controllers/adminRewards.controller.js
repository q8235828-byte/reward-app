const rewardService = require('../services/reward.service');

async function listRewards(req, res, next) {
  try {
    const { page, pageSize } = req.validated.query;
    const result = await rewardService.listAllRewards({ page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = { listRewards };
