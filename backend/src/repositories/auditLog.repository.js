async function create(conn, {
  adminId, action, targetType, targetId, previousValue, newValue, ipAddress,
}) {
  const [result] = await conn.query(
    `INSERT INTO audit_logs (admin_id, action, target_type, target_id, previous_value, new_value, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [adminId, action, targetType, targetId, previousValue, newValue, ipAddress],
  );
  return result.insertId;
}

function buildFilterClause({ adminId, action }) {
  const conditions = [];
  const params = [];
  if (adminId) {
    conditions.push('admin_id = ?');
    params.push(adminId);
  }
  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

async function listAll(conn, {
  adminId, action, page, pageSize,
}) {
  const { where, params } = buildFilterClause({ adminId, action });
  const offset = (page - 1) * pageSize;
  const [rows] = await conn.query(
    `SELECT al.*, u.full_name AS admin_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.admin_id
     ${where}
     ORDER BY al.created_at DESC, al.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );
  return rows;
}

async function countAll(conn, { adminId, action }) {
  const { where, params } = buildFilterClause({ adminId, action });
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM audit_logs ${where}`, params);
  return Number(rows[0].total);
}

function sanitizeAuditLog(row) {
  if (!row) return null;
  return {
    id: row.id,
    adminId: row.admin_id,
    adminName: row.admin_name,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    previousValue: row.previous_value,
    newValue: row.new_value,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  };
}

module.exports = {
  create, listAll, countAll, sanitizeAuditLog,
};
