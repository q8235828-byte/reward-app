async function findByEmail(conn, email) {
  const [rows] = await conn.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function findByPhone(conn, phone) {
  const [rows] = await conn.query('SELECT * FROM users WHERE phone = ? LIMIT 1', [phone]);
  return rows[0] || null;
}

async function findByReferralCode(conn, referralCode) {
  const [rows] = await conn.query('SELECT * FROM users WHERE referral_code = ? LIMIT 1', [referralCode]);
  return rows[0] || null;
}

async function findById(conn, id) {
  const [rows] = await conn.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function getForUpdate(conn, id) {
  const [rows] = await conn.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [id]);
  return rows[0] || null;
}

function buildAdminFilterClause({ search, status }) {
  const conditions = [];
  const params = [];
  if (search) {
    conditions.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR referral_code LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

async function search(conn, {
  search: term, status, page, pageSize,
}) {
  const { where, params } = buildAdminFilterClause({ search: term, status });
  const offset = (page - 1) * pageSize;
  const [rows] = await conn.query(
    `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );
  return rows;
}

async function count(conn, { search: term, status }) {
  const { where, params } = buildAdminFilterClause({ search: term, status });
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
  return Number(rows[0].total);
}

async function updateStatus(conn, id, status) {
  await conn.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
}

async function referralCodeExists(conn, referralCode) {
  const [rows] = await conn.query('SELECT id FROM users WHERE referral_code = ? LIMIT 1', [referralCode]);
  return rows.length > 0;
}

async function createUser(conn, {
  fullName, email, phone, passwordHash, referralCode, referredBy,
}) {
  const [result] = await conn.query(
    `INSERT INTO users (full_name, email, phone, password_hash, referral_code, referred_by, role, status)
     VALUES (?, ?, ?, ?, ?, ?, 'USER', 'ACTIVE')`,
    [fullName, email, phone, passwordHash, referralCode, referredBy],
  );
  return result.insertId;
}

async function updateLastLogin(conn, userId) {
  await conn.query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
}

async function updatePasswordHash(conn, userId, passwordHash) {
  await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}

// Invalidates every JWT previously issued to this user (used by logout,
// password change, and password reset) since stateless JWTs otherwise
// can't be revoked before they expire.
async function incrementTokenVersion(conn, userId) {
  await conn.query('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [userId]);
}

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    role: row.role,
    status: row.status,
    lastLogin: row.last_login,
    createdAt: row.created_at,
  };
}

module.exports = {
  findByEmail,
  findByPhone,
  findByReferralCode,
  findById,
  getForUpdate,
  search,
  count,
  updateStatus,
  referralCodeExists,
  createUser,
  updateLastLogin,
  updatePasswordHash,
  incrementTokenVersion,
  sanitizeUser,
};
