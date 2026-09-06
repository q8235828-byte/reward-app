const { runDailyRewardJob } = require('../jobs/dailyRewardJob');

async function processDailyRewards(req, res, next) {
  try {
    const referenceDate = req.body.date ? new Date(`${req.body.date}T00:00:00.000Z`) : undefined;
    const result = await runDailyRewardJob(referenceDate);
    res.status(200).json({ success: true, message: 'Daily reward job completed.', data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = { processDailyRewards };
