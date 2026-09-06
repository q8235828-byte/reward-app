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

// Rewards are still paid on a plan's own locked-in rate/frequency even if
// an admin later disables that plan for new signups - only the user_plan's
// own status matters here, not the plan's current status.
async function findActiveWithPlanForRewardProcessing(conn) {
  const [rows] = await conn.query(
    `SELECT up.*, p.reward_rate AS plan_reward_rate, p.reward_frequency AS plan_reward_frequency
     FROM user_plans up
     JOIN plans p ON p.id = up.plan_id
     WHERE up.status = 'ACTIVE'`,
  );
  return rows;
}

module.exports = { create, findActiveWithPlanForRewardProcessing };
