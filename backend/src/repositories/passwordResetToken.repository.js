async function deleteAllForUser(conn, userId) {
  await conn.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
}

async function create(conn, { userId, tokenHash, expiresAt }) {
  await conn.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt],
  );
}

async function findValidByHash(conn, tokenHash) {
  const [rows] = await conn.query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
    [tokenHash],
  );
  return rows[0] || null;
}

async function markUsed(conn, id) {
  await conn.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [id]);
}

module.exports = {
  deleteAllForUser, create, findValidByHash, markUsed,
};
