async function create(conn, {
  userId, amount, paymentMethod, accountName, accountNumber, status,
}) {
  const [result] = await conn.query(
    `INSERT INTO withdrawals (user_id, amount, payment_method, account_name, account_number, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, amount, paymentMethod, accountName, accountNumber, status],
  );
  return result.insertId;
}

async function findById(conn, id) {
  const [rows] = await conn.query('SELECT * FROM withdrawals WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

// Row-locks the withdrawal so two admin actions (or a retry) can't both
// process the same withdrawal at once (PMD section 33).
async function getForUpdate(conn, id) {
  const [rows] = await conn.query('SELECT * FROM withdrawals WHERE id = ? FOR UPDATE', [id]);
  return rows[0] || null;
}

async function hasActiveForUser(conn, userId) {
  const [rows] = await conn.query(
    "SELECT id FROM withdrawals WHERE user_id = ? AND status IN ('PENDING','PROCESSING') LIMIT 1",
    [userId],
  );
  return rows.length > 0;
}

async function updateStatus(conn, id, {
  status, adminNote, processedBy, processedAt,
}) {
  await conn.query(
    'UPDATE withdrawals SET status = ?, admin_note = ?, processed_by = ?, processed_at = ? WHERE id = ?',
    [status, adminNote, processedBy, processedAt, id],
  );
}

function buildFilterClause({ status }) {
  const conditions = ['user_id = ?'];
  const params = [];
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  return { conditions, params };
}

async function listByUser(conn, userId, {
  status, page, pageSize,
}) {
  const { conditions, params } = buildFilterClause({ status });
  const offset = (page - 1) * pageSize;
  const [rows] = await conn.query(
    `SELECT * FROM withdrawals WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [userId, ...params, pageSize, offset],
  );
  return rows;
}

async function countByUser(conn, userId, { status }) {
  const { conditions, params } = buildFilterClause({ status });
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS total FROM withdrawals WHERE ${conditions.join(' AND ')}`,
    [userId, ...params],
  );
  return Number(rows[0].total);
}

function buildAdminFilterClause({ status }) {
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

// Admin view - across all users, unlike listByUser/countByUser.
async function listAll(conn, { status, page, pageSize }) {
  const { where, params } = buildAdminFilterClause({ status });
  const offset = (page - 1) * pageSize;
  const [rows] = await conn.query(
    `SELECT w.*, u.full_name AS user_full_name, u.phone AS user_phone
     FROM withdrawals w
     JOIN users u ON u.id = w.user_id
     ${where}
     ORDER BY w.created_at DESC, w.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );
  return rows;
}

async function countAll(conn, { status }) {
  const { where, params } = buildAdminFilterClause({ status });
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM withdrawals ${where}`, params);
  return Number(rows[0].total);
}

function sanitizeWithdrawal(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userFullName: row.user_full_name,
    userPhone: row.user_phone,
    amount: row.amount,
    paymentMethod: row.payment_method,
    accountName: row.account_name,
    accountNumber: row.account_number,
    status: row.status,
    adminNote: row.admin_note,
    processedBy: row.processed_by,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  create,
  findById,
  getForUpdate,
  hasActiveForUser,
  updateStatus,
  listByUser,
  countByUser,
  listAll,
  countAll,
  sanitizeWithdrawal,
};
