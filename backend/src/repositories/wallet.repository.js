async function createWallet(conn, userId) {
  await conn.query('INSERT INTO wallets (user_id) VALUES (?)', [userId]);
}

async function getByUserId(conn, userId) {
  const [rows] = await conn.query('SELECT * FROM wallets WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

// Row-locks the wallet within the caller's transaction so concurrent
// credits/debits for the same user serialize instead of racing.
async function getForUpdate(conn, userId) {
  const [rows] = await conn.query('SELECT * FROM wallets WHERE user_id = ? FOR UPDATE', [userId]);
  return rows[0] || null;
}

async function updateBalances(conn, userId, {
  depositBalance, rewardBalance, referralBalance, withdrawableBalance, totalEarned, totalWithdrawn,
}) {
  await conn.query(
    `UPDATE wallets SET
       deposit_balance = ?, reward_balance = ?, referral_balance = ?,
       withdrawable_balance = ?, total_earned = ?, total_withdrawn = ?
     WHERE user_id = ?`,
    [depositBalance, rewardBalance, referralBalance, withdrawableBalance, totalEarned, totalWithdrawn, userId],
  );
}

function sanitizeWallet(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    depositBalance: row.deposit_balance,
    rewardBalance: row.reward_balance,
    referralBalance: row.referral_balance,
    withdrawableBalance: row.withdrawable_balance,
    totalEarned: row.total_earned,
    totalWithdrawn: row.total_withdrawn,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  createWallet, getByUserId, getForUpdate, updateBalances, sanitizeWallet,
};
