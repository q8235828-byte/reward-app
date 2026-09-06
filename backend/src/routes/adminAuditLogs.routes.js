const express = require('express');
const controller = require('../controllers/adminAuditLogs.controller');
const { validate } = require('../middleware/validate');
const { listAuditLogsQuerySchema } = require('../validators/admin.validator');

const router = express.Router();

router.get('/', validate(listAuditLogsQuerySchema, 'query'), controller.listAuditLogs);

module.exports = router;
