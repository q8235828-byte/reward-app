const pool = require('../config/database');

// One-off aggregation queries with a single caller (this dashboard) - kept
// as plain SQL in the service rather than a repository layer, since a
// repository's value is reuse across callers and there isn't one here.
async function getDashboardStats() {
  const [
    [userRows],
    [depositRows],
    [withdrawalRows],
    [rewardRows],
    [commissionRows],
  ] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) AS totalUsers,
         COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS activeUsers
       FROM users`,
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END), 0) AS totalDeposits,
         COALESCE(SUM(CASE WHEN status IN ('PENDING','UNDER_REVIEW') THEN 1 ELSE 0 END), 0) AS pendingDeposits,
         COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END), 0) AS approvedDeposits
       FROM deposits`,
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) AS totalWithdrawals,
         COALESCE(SUM(CASE WHEN status IN ('PENDING','PROCESSING','APPROVED') THEN 1 ELSE 0 END), 0) AS pendingWithdrawals,
         COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) AS paidWithdrawals
       FROM withdrawals`,
    ),
    pool.query("SELECT COALESCE(SUM(reward_amount), 0) AS totalRewards FROM reward_ledger WHERE status = 'CREDITED'"),
    pool.query("SELECT COALESCE(SUM(amount), 0) AS totalReferralCommissions FROM referral_commissions WHERE status = 'PAID'"),
  ]);

  const userRow = userRows[0];
  const depositRow = depositRows[0];
  const withdrawalRow = withdrawalRows[0];
  const rewardRow = rewardRows[0];
  const commissionRow = commissionRows[0];

  return {
    totalUsers: Number(userRow.totalUsers),
    activeUsers: Number(userRow.activeUsers),
    totalDeposits: depositRow.totalDeposits,
    pendingDeposits: Number(depositRow.pendingDeposits),
    approvedDeposits: Number(depositRow.approvedDeposits),
    totalWithdrawals: withdrawalRow.totalWithdrawals,
    pendingWithdrawals: Number(withdrawalRow.pendingWithdrawals),
    paidWithdrawals: Number(withdrawalRow.paidWithdrawals),
    totalRewards: rewardRow.totalRewards,
    totalReferralCommissions: commissionRow.totalReferralCommissions,
  };
}

module.exports = { getDashboardStats };
