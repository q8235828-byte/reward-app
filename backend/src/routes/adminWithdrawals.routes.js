const express = require('express');
const controller = require('../controllers/adminWithdrawals.controller');
const { validate } = require('../middleware/validate');
const { listAllWithdrawalsQuerySchema, adminActionNoteSchema } = require('../validators/admin.validator');

const router = express.Router();

router.get('/', validate(listAllWithdrawalsQuerySchema, 'query'), controller.listWithdrawals);
router.post('/:id/approve', validate(adminActionNoteSchema), controller.approveWithdrawal);
router.post('/:id/processing', validate(adminActionNoteSchema), controller.markProcessing);
router.post('/:id/paid', validate(adminActionNoteSchema), controller.markPaid);
router.post('/:id/reject', validate(adminActionNoteSchema), controller.rejectWithdrawal);

module.exports = router;
