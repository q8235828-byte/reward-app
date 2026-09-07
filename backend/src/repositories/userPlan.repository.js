async function create(conn, {
  userId, planId, amount, status, startedAt,
}) {
  const [result] = await conn.query(
    `INSERT INTO user_plans (user_id, plan_id, amount, status, started_at)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, planId, amount, status, startedAt],
  );
  return result.insertId;
}

// Rewards are still paid on a plan's own locked-in rate/frequency/duration
// even if an admin later disables that plan for new signups - only the
// user_plan's own status matters here, not the plan's current status.
async function findActiveWithPlanForRewardProcessing(conn) {
  const [rows] = await conn.query(
    `SELECT up.*, p.reward_rate AS plan_reward_rate, p.reward_frequency AS plan_reward_frequency,
       p.duration_days AS plan_duration_days
     FROM user_plans up
     JOIN plans p ON p.id = up.plan_id
     WHERE up.status = 'ACTIVE'`,
  );
  return rows;
}

// Marks a user_plan COMPLETED once it reaches its plan's duration_days -
// guarded by "AND status = 'ACTIVE'" so a repeat cron run (or a race with
// an admin action) can't flip an already-completed/cancelled plan back.
async function markCompletedIfActive(conn, id, endedAt) {
  await conn.query(
    "UPDATE user_plans SET status = 'COMPLETED', ended_at = ? WHERE id = ? AND status = 'ACTIVE'",
    [endedAt, id],
  );
}

// User-facing (WithdrawPage's "Your active plans") - one user's own active
// plan instances with the reward_ledger aggregates (cycles paid, total
// profit) needed to show progress. The subquery groups reward_ledger once
// rather than joining it row-per-reward, which would multiply up rows.
async function listActiveWithStatsByUser(conn, userId) {
  const [rows] = await conn.query(
    `SELECT up.id, up.plan_id, up.amount, up.started_at,
       p.name AS plan_name, p.reward_rate AS plan_reward_rate,
       p.reward_frequency AS plan_reward_frequency, p.duration_days AS plan_duration_days,
       COALESCE(rl.cycles_completed, 0) AS cycles_completed,
       COALESCE(rl.profit_received, 0) AS profit_received
     FROM user_plans up
     JOIN plans p ON p.id = up.plan_id
     LEFT JOIN (
       SELECT user_plan_id, COUNT(*) AS cycles_completed, SUM(reward_amount) AS profit_received
       FROM reward_ledger
       GROUP BY user_plan_id
     ) rl ON rl.user_plan_id = up.id
     WHERE up.user_id = ? AND up.status = 'ACTIVE'
     ORDER BY up.started_at DESC`,
    [userId],
  );
  return rows;
}

module.exports = {
  create, findActiveWithPlanForRewardProcessing, markCompletedIfActive, listActiveWithStatsByUser,
};
