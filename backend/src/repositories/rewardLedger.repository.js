async function findExisting(conn, { userId, userPlanId, rewardDate }) {
  const [rows] = await conn.query(
    'SELECT * FROM reward_ledger WHERE user_id = ? AND user_plan_id = ? AND reward_date = ? LIMIT 1',
    [userId, userPlanId, rewardDate],
  );
  return rows[0] || null;
}

async function create(conn, {
  userId, userPlanId, rewardDate, eligibleAmount, rewardRate, rewardAmount, status,
}) {
  const [result] = await conn.query(
    `INSERT INTO reward_ledger (user_id, user_plan_id, reward_date, eligible_amount, reward_rate, reward_amount, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, userPlanId, rewardDate, eligibleAmount, rewardRate, rewardAmount, status],
  );
  return result.insertId;
}

// Admin view - the reward_ledger table has no per-user route (user reward
// history flows through GET /api/transactions?type=REWARD instead - see
// Phase 9's README note), but admin needs to see the raw ledger.
async function listAllAdmin(conn, { page, pageSize }) {
  const offset = (page - 1) * pageSize;
  const [rows] = await conn.query(
    `SELECT rl.*, u.full_name AS user_full_name, u.email AS user_email
     FROM reward_ledger rl
     JOIN users u ON u.id = rl.user_id
     ORDER BY rl.reward_date DESC, rl.id DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset],
  );
  return rows;
}

async function countAllAdmin(conn) {
  const [rows] = await conn.query('SELECT COUNT(*) AS total FROM reward_ledger');
  return Number(rows[0].total);
}

function sanitizeRewardLedgerAdmin(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userFullName: row.user_full_name,
    userEmail: row.user_email,
    userPlanId: row.user_plan_id,
    rewardDate: row.reward_date,
    eligibleAmount: row.eligible_amount,
    rewardRate: row.reward_rate,
    rewardAmount: row.reward_amount,
    status: row.status,
    createdAt: row.created_at,
  };
}

module.exports = {
  findExisting, create, listAllAdmin, countAllAdmin, sanitizeRewardLedgerAdmin,
};
