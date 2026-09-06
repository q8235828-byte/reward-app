const express = require('express');
const controller = require('../controllers/adminDeposits.controller');
const { validate } = require('../middleware/validate');
const { listAllDepositsQuerySchema, adminActionNoteSchema } = require('../validators/admin.validator');

const router = express.Router();

router.get('/', validate(listAllDepositsQuerySchema, 'query'), controller.listDeposits);
router.post('/:id/approve', validate(adminActionNoteSchema), controller.approveDeposit);
router.post('/:id/reject', validate(adminActionNoteSchema), controller.rejectDeposit);

module.exports = router;
