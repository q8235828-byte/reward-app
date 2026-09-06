async function create(conn, { referrerId, referredUserId, referralCode }) {
  const [result] = await conn.query(
    `INSERT INTO referrals (referrer_id, referred_user_id, referral_code, status)
     VALUES (?, ?, ?, 'NOT_QUALIFIED')`,
    [referrerId, referredUserId, referralCode],
  );
  return result.insertId;
}

async function findByReferredUserId(conn, referredUserId) {
  const [rows] = await conn.query('SELECT * FROM referrals WHERE referred_user_id = ? LIMIT 1', [referredUserId]);
  return rows[0] || null;
}

async function markQualified(conn, id) {
  await conn.query("UPDATE referrals SET status = 'QUALIFIED' WHERE id = ? AND status = 'NOT_QUALIFIED'", [id]);
}

// "Qualifying" per PMD section 26 = made at least one approved deposit, not
// just registered. ACTIVE referrals also count toward the threshold.
async function countQualifiedByReferrer(conn, referrerId) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS total FROM referrals WHERE referrer_id = ? AND status IN ('QUALIFIED','ACTIVE')",
    [referrerId],
  );
  return Number(rows[0].total);
}

async function countByReferrer(conn, referrerId) {
  const [rows] = await conn.query('SELECT COUNT(*) AS total FROM referrals WHERE referrer_id = ?', [referrerId]);
  return Number(rows[0].total);
}

async function listByReferrer(conn, referrerId, { page, pageSize }) {
  const offset = (page - 1) * pageSize;
  const [rows] = await conn.query(
    `SELECT r.*, u.full_name AS referred_full_name
     FROM referrals r
     JOIN users u ON u.id = r.referred_user_id
     WHERE r.referrer_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [referrerId, pageSize, offset],
  );
  return rows;
}

function sanitizeReferral(row) {
  if (!row) return null;
  return {
    id: row.id,
    referredUserName: row.referred_full_name,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Admin view - every referral relationship across every user, unlike
// listByReferrer/countByReferrer which are scoped to one referrer.
async function listAllAdmin(conn, { status, page, pageSize }) {
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;
  const [rows] = await conn.query(
    `SELECT r.*, referrer.full_name AS referrer_name, referred.full_name AS referred_name
     FROM referrals r
     JOIN users referrer ON referrer.id = r.referrer_id
     JOIN users referred ON referred.id = r.referred_user_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );
  return rows;
}

async function countAllAdmin(conn, { status }) {
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM referrals ${where}`, params);
  return Number(rows[0].total);
}

function sanitizeReferralAdmin(row) {
  if (!row) return null;
  return {
    id: row.id,
    referrerId: row.referrer_id,
    referrerName: row.referrer_name,
    referredUserId: row.referred_user_id,
    referredUserName: row.referred_name,
    status: row.status,
    createdAt: row.created_at,
  };
}

module.exports = {
  create,
  findByReferredUserId,
  markQualified,
  countQualifiedByReferrer,
  countByReferrer,
  listByReferrer,
  listAllAdmin,
  countAllAdmin,
  sanitizeReferral,
  sanitizeReferralAdmin,
};
