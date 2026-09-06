const auditLogService = require('../services/auditLog.service');

async function listAuditLogs(req, res, next) {
  try {
    const {
      adminId, action, page, pageSize,
    } = req.validated.query;
    const result = await auditLogService.listAuditLogs({
      adminId, action, page, pageSize,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = { listAuditLogs };
