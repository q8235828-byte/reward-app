const pool = require('../config/database');
const userPlanRepository = require('../repositories/userPlan.repository');
const { toDecimal } = require('../utils/money');

const DAY_MS = 24 * 60 * 60 * 1000;

function msToDaysHours(ms) {
  const clamped = Math.max(0, ms);
  return {
    days: Math.floor(clamped / DAY_MS),
    hours: Math.floor((clamped % DAY_MS) / (60 * 60 * 1000)),
  };
}

// Rewards are credited by a daily cron run against the calendar day (UTC),
// not a fixed number of hours after a plan's own start time - see
// reward.service.js. The next reward therefore becomes eligible at the
// next UTC-midnight boundary, whatever time the admin's cron happens to
// run after that.
function nextUtcMidnight(from) {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 1));
}

function utcMidnight(from) {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
}

// User-facing summary for WithdrawPage's "Your active plans" section - one
// entry per ACTIVE user_plan the given user holds, with progress/reward
// stats computed relative to "now" (not stored, since it changes every
// request).
async function listActivePlansForUser(userId) {
  const rows = await userPlanRepository.listActiveWithStatsByUser(pool, userId);
  const now = new Date();
  const todayStart = utcMidnight(now);
  const nextRewardAt = nextUtcMidnight(now);
  const cycleProgressPercent = ((now.getTime() - todayStart.getTime()) / DAY_MS) * 100;

  return rows.map((row) => {
    const startedAt = new Date(row.started_at);
    const elapsedMs = now.getTime() - startedAt.getTime();
    const durationDays = row.plan_duration_days;
    const durationMs = durationDays ? durationDays * DAY_MS : null;
    const progressPercent = durationMs ? Math.min(100, (elapsedMs / durationMs) * 100) : null;
    const remainingMs = durationMs ? Math.max(0, durationMs - elapsedMs) : null;

    const timePassed = msToDaysHours(elapsedMs);
    const timeRemaining = remainingMs !== null ? msToDaysHours(remainingMs) : null;

    return {
      userPlanId: row.id,
      planName: row.plan_name,
      rewardRate: row.plan_reward_rate,
      rewardFrequency: row.plan_reward_frequency,
      investedAmount: row.amount,
      startedAt: row.started_at,
      durationDays,
      timePassedDays: timePassed.days,
      timePassedHours: timePassed.hours,
      timeRemainingDays: timeRemaining ? timeRemaining.days : null,
      timeRemainingHours: timeRemaining ? timeRemaining.hours : null,
      progressPercent,
      cyclesCompleted: Number(row.cycles_completed),
      totalCycles: durationDays,
      profitReceived: toDecimal(row.profit_received).toFixed(2),
      nextRewardAt,
      cycleProgressPercent,
    };
  });
}

module.exports = { listActivePlansForUser };
