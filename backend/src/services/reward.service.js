const pool = require('../config/database');
const userPlanRepository = require('../repositories/userPlan.repository');
const rewardLedgerRepository = require('../repositories/rewardLedger.repository');
const walletService = require('./wallet.service');
const { toDecimal } = require('../utils/money');

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function daysSince(startedAt, referenceDate) {
  const start = new Date(startedAt);
  const startMidnightUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const refMidnightUtc = Date.UTC(
    referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate(),
  );
  return Math.floor((refMidnightUtc - startMidnightUtc) / DAY_MS);
}

// WEEKLY/MONTHLY plans pay on the day they started and every 7/30 days
// after (30-day month approximation - no plan currently seeded uses these,
// only DAILY, so this is here for when an admin configures one). Takes
// `elapsed` rather than recomputing it, since the caller already needs it
// for the duration/maturity check right before this.
function isRewardDue(userPlan, elapsed) {
  switch (userPlan.plan_reward_frequency) {
    case 'DAILY':
      return true;
    case 'WEEKLY':
      return elapsed % 7 === 0;
    case 'MONTHLY':
      return elapsed % 30 === 0;
    default:
      return false;
  }
}

// Credits (or skips, if already credited) the reward for one user_plan on
// one date, in its own short transaction - so one bad row can't roll back
// the rest of the day's batch, and a re-run for the same date is a safe
// no-op (checked here, and backstopped by reward_ledger's own unique
// constraint on (user_id, user_plan_id, reward_date), per PMD section 22).
async function processOne(userPlan, rewardDate) {
  const existing = await rewardLedgerRepository.findExisting(pool, {
    userId: userPlan.user_id, userPlanId: userPlan.id, rewardDate,
  });
  if (existing) return { skipped: true, reason: 'ALREADY_PROCESSED' };

  // No compounding (PMD section 23): eligible_amount is always the
  // original plan principal, never the running wallet/reward balance.
  const eligibleAmount = toDecimal(userPlan.amount);
  const rewardRate = toDecimal(userPlan.plan_reward_rate);
  const rewardAmount = eligibleAmount.times(rewardRate).dividedBy(100);

  if (rewardAmount.lte(0)) return { skipped: true, reason: 'ZERO_REWARD' };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let ledgerId;
    try {
      ledgerId = await rewardLedgerRepository.create(connection, {
        userId: userPlan.user_id,
        userPlanId: userPlan.id,
        rewardDate,
        eligibleAmount: eligibleAmount.toFixed(2),
        rewardRate: rewardRate.toFixed(4),
        rewardAmount: rewardAmount.toFixed(2),
        status: 'CREDITED',
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        await connection.rollback();
        return { skipped: true, reason: 'ALREADY_PROCESSED' };
      }
      throw error;
    }

    await walletService.creditReward(connection, {
      userId: userPlan.user_id,
      amount: rewardAmount,
      reference: `REWARD-${ledgerId}`,
      description: `Daily reward for plan #${userPlan.plan_id} (${rewardDate}).`,
    });

    await connection.commit();
    return { skipped: false, ledgerId, rewardAmount: rewardAmount.toFixed(2) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Entry point the (Phase 10) cron endpoint calls. Safe to call more than
// once for the same date - already-credited user_plans are skipped, and
// one user_plan's failure doesn't stop the rest from being processed.
async function processDailyRewards(referenceDate = new Date()) {
  const rewardDate = toDateOnly(referenceDate);
  const userPlans = await userPlanRepository.findActiveWithPlanForRewardProcessing(pool);

  const summary = {
    date: rewardDate, processed: 0, skipped: 0, failed: 0, errors: [],
  };

  for (const userPlan of userPlans) {
    if (!userPlan.started_at) {
      summary.skipped += 1;
      continue; // eslint-disable-line no-continue
    }

    const elapsed = daysSince(userPlan.started_at, referenceDate);
    if (elapsed < 0) {
      summary.skipped += 1;
      continue; // eslint-disable-line no-continue
    }

    // A plan with a duration_days cap (see PlansPage - all seeded plans
    // are 40 days) stops paying once it matures; mark it COMPLETED instead
    // of silently skipping forever, so it drops out of future runs' query.
    if (userPlan.plan_duration_days && elapsed >= userPlan.plan_duration_days) {
      // eslint-disable-next-line no-await-in-loop
      await userPlanRepository.markCompletedIfActive(pool, userPlan.id, referenceDate);
      summary.skipped += 1;
      continue; // eslint-disable-line no-continue
    }

    if (!isRewardDue(userPlan, elapsed)) {
      summary.skipped += 1;
      continue; // eslint-disable-line no-continue
    }

    try {
      // Sequential on purpose: keeps DB load predictable on shared
      // hosting and keeps failures attributable to one user_plan at a time.
      // eslint-disable-next-line no-await-in-loop
      const outcome = await processOne(userPlan, rewardDate);
      if (outcome.skipped) {
        summary.skipped += 1;
      } else {
        summary.processed += 1;
      }
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({ userPlanId: userPlan.id, message: error.message });
    }
  }

  return summary;
}

async function listAllRewards({ page = 1, pageSize = 20 } = {}) {
  const [items, total] = await Promise.all([
    rewardLedgerRepository.listAllAdmin(pool, { page, pageSize }),
    rewardLedgerRepository.countAllAdmin(pool),
  ]);
  return {
    items: items.map(rewardLedgerRepository.sanitizeRewardLedgerAdmin),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

module.exports = { processDailyRewards, listAllRewards };
