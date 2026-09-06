async function create(conn, {
  referrerId, referredUserId, sourceTransactionId, commissionType, rate, amount, status,
}) {
  const [result] = await conn.query(
    `INSERT INTO referral_commissions
       (referrer_id, referred_user_id, source_transaction_id, commission_type, rate, amount, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [referrerId, referredUserId, sourceTransactionId, commissionType, rate, amount, status],
  );
  return result.insertId;
}

async function findBySource(conn, sourceTransactionId, commissionType) {
  const [rows] = await conn.query(
    'SELECT * FROM referral_commissions WHERE source_transaction_id = ? AND commission_type = ? LIMIT 1',
    [sourceTransactionId, commissionType],
  );
  return rows[0] || null;
}

async function sumByReferrer(conn, referrerId) {
  const [rows] = await conn.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM referral_commissions WHERE referrer_id = ? AND status = 'PAID'",
    [referrerId],
  );
  return rows[0].total;
}

module.exports = {
  create, findBySource, sumByReferrer,
};
