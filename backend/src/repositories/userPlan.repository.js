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

module.exports = { create, findActiveWithPlanForRewardProcessing, markCompletedIfActive };
