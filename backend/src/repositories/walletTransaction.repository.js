async function insert(conn, {
  userId, type, amount, balanceBefore, balanceAfter, reference, description, status = 'COMPLETED',
}) {
  const [result] = await conn.query(
    `INSERT INTO wallet_transactions
       (user_id, type, amount, balance_before, balance_after, reference, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, type, amount, balanceBefore, balanceAfter, reference, description, status],
  );
  return result.insertId;
}

async function findById(conn, id) {
  const [rows] = await conn.query('SELECT * FROM wallet_transactions WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findByReference(conn, reference) {
  const [rows] = await conn.query('SELECT * FROM wallet_transactions WHERE reference = ? LIMIT 1', [reference]);
  return rows[0] || null;
}

function buildFilterClause({ type, status }) {
  const conditions = ['user_id = ?'];
  const params = [];
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  return { conditions, params };
}

async function listByUser(conn, userId, {
  type, status, page, pageSize,
}) {
  const { conditions, params } = buildFilterClause({ type, status });
  const offset = (page - 1) * pageSize;
  const [rows] = await conn.query(
    `SELECT * FROM wallet_transactions WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [userId, ...params, pageSize, offset],
  );
  return rows;
}

async function countByUser(conn, userId, { type, status }) {
  const { conditions, params } = buildFilterClause({ type, status });
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS total FROM wallet_transactions WHERE ${conditions.join(' AND ')}`,
    [userId, ...params],
  );
  return Number(rows[0].total);
}

function sanitizeTransaction(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userFullName: row.user_full_name,
    userPhone: row.user_phone,
    type: row.type,
    amount: row.amount,
    balanceBefore: row.balance_before,
    balanceAfter: row.balance_after,
    reference: row.reference,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Admin view - across every user, unlike listByUser/countByUser.
async function listAllAdmin(conn, {
  type, status, page, pageSize,
}) {
  const conditions = [];
  const params = [];
  if (type) {
    conditions.push('wt.type = ?');
    params.push(type);
  }
  if (status) {
    conditions.push('wt.status = ?');
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;
  const [rows] = await conn.query(
    `SELECT wt.*, u.full_name AS user_full_name, u.phone AS user_phone
     FROM wallet_transactions wt
     JOIN users u ON u.id = wt.user_id
     ${where}
     ORDER BY wt.created_at DESC, wt.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );
  return rows;
}

async function countAllAdmin(conn, { type, status }) {
  const conditions = [];
  const params = [];
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM wallet_transactions ${where}`, params);
  return Number(rows[0].total);
}

module.exports = {
  insert, findById, findByReference, listByUser, countByUser, listAllAdmin, countAllAdmin, sanitizeTransaction,
};
