const rewardService = require('../services/reward.service');

// Thin orchestration layer around RewardService: timing + logging (PMD
// section 27, step 9 - "log result"). The actual reward calculation and
// idempotency guarantees live in the service, not here.
async function runDailyRewardJob(referenceDate = new Date()) {
  const startedAt = Date.now();
  console.log(`[daily-reward-job] starting for ${referenceDate.toISOString().slice(0, 10)}`);

  const summary = await rewardService.processDailyRewards(referenceDate);
  const durationMs = Date.now() - startedAt;

  console.log(
    `[daily-reward-job] done: date=${summary.date} processed=${summary.processed} `
      + `skipped=${summary.skipped} failed=${summary.failed} durationMs=${durationMs}`,
  );
  if (summary.failed > 0) {
    console.error(`[daily-reward-job] ${summary.failed} user_plan(s) failed:`, summary.errors);
  }

  return { ...summary, durationMs };
}

module.exports = { runDailyRewardJob };
