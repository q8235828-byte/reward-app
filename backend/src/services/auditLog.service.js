const pool = require('../config/database');
const auditLogRepository = require('../repositories/auditLog.repository');

function stringifyValue(value) {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

// Every admin mutation calls this from inside its own DB transaction
// (PMD section 48 - "every important admin action must be logged"), so
// the action and its audit trail commit or roll back together.
async function log(conn, {
  adminId, action, targetType = null, targetId = null, previousValue = null, newValue = null, ipAddress = null,
}) {
  await auditLogRepository.create(conn, {
    adminId,
    action,
    targetType,
    targetId,
    previousValue: stringifyValue(previousValue),
    newValue: stringifyValue(newValue),
    ipAddress,
  });
}

async function listAuditLogs({
  adminId, action, page = 1, pageSize = 20,
}) {
  const [items, total] = await Promise.all([
    auditLogRepository.listAll(pool, {
      adminId, action, page, pageSize,
    }),
    auditLogRepository.countAll(pool, { adminId, action }),
  ]);
  return {
    items: items.map(auditLogRepository.sanitizeAuditLog),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

module.exports = { log, listAuditLogs };
