async function create(conn, {
  userId, channel, codeHash, expiresAt,
}) {
  const [result] = await conn.query(
    'INSERT INTO verification_codes (user_id, channel, code_hash, expires_at) VALUES (?, ?, ?, ?)',
    [userId, channel, codeHash, expiresAt],
  );
  return result.insertId;
}

async function findLatestActive(conn, userId, channel) {
  const [rows] = await conn.query(
    `SELECT * FROM verification_codes
     WHERE user_id = ? AND channel = ? AND used_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId, channel],
  );
  return rows[0] || null;
}

async function findValidByHash(conn, userId, channel, codeHash) {
  const [rows] = await conn.query(
    `SELECT * FROM verification_codes
     WHERE user_id = ? AND channel = ? AND code_hash = ? AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [userId, channel, codeHash],
  );
  return rows[0] || null;
}

async function incrementAttempts(conn, id) {
  await conn.query('UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?', [id]);
}

async function markUsed(conn, id) {
  await conn.query('UPDATE verification_codes SET used_at = NOW() WHERE id = ?', [id]);
}

async function invalidateActive(conn, userId, channel) {
  await conn.query(
    "UPDATE verification_codes SET used_at = NOW() WHERE user_id = ? AND channel = ? AND used_at IS NULL",
    [userId, channel],
  );
}

module.exports = {
  create, findLatestActive, findValidByHash, incrementAttempts, markUsed, invalidateActive,
};
