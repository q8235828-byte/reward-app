async function create(conn, {
  userId, planId, amount, paymentMethod, transactionReference, status,
}) {
  const [result] = await conn.query(
    `INSERT INTO deposits (user_id, plan_id, amount, payment_method, transaction_reference, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, planId, amount, paymentMethod, transactionReference, status],
  );
  return result.insertId;
}

async function findById(conn, id) {
  const [rows] = await conn.query('SELECT * FROM deposits WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

// Row-locks the deposit so two admin requests (or a retry) can't both
// approve/reject the same deposit at once.
async function getForUpdate(conn, id) {
  const [rows] = await conn.query('SELECT * FROM deposits WHERE id = ? FOR UPDATE', [id]);
  return rows[0] || null;
}

async function updateTransactionReference(conn, id, transactionReference, status) {
  await conn.query(
    'UPDATE deposits SET transaction_reference = ?, status = ? WHERE id = ?',
    [transactionReference, status, id],
  );
}

async function updateStatus(conn, id, {
  status, adminNote, verifiedBy, verifiedAt,
}) {
  await conn.query(
    'UPDATE deposits SET status = ?, admin_note = ?, verified_by = ?, verified_at = ? WHERE id = ?',
    [status, adminNote, verifiedBy, verifiedAt, id],
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
    `SELECT * FROM deposits WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [userId, ...params, pageSize, offset],
  );
  return rows;
}

async function countByUser(conn, userId, { status }) {
  const { conditions, params } = buildFilterClause({ status });
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS total FROM deposits WHERE ${conditions.join(' AND ')}`,
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
    `SELECT d.*, u.full_name AS user_full_name, u.email AS user_email
     FROM deposits d
     JOIN users u ON u.id = d.user_id
     ${where}
     ORDER BY d.created_at DESC, d.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );
  return rows;
}

async function countAll(conn, { status }) {
  const { where, params } = buildAdminFilterClause({ status });
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM deposits ${where}`, params);
  return Number(rows[0].total);
}

function sanitizeDeposit(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userFullName: row.user_full_name,
    userEmail: row.user_email,
    planId: row.plan_id,
    amount: row.amount,
    paymentMethod: row.payment_method,
    transactionReference: row.transaction_reference,
    status: row.status,
    adminNote: row.admin_note,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  create,
  findById,
  getForUpdate,
  updateTransactionReference,
  updateStatus,
  listByUser,
  countByUser,
  listAll,
  countAll,
  sanitizeDeposit,
};
