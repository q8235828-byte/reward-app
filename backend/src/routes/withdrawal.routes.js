const express = require('express');
const controller = require('../controllers/withdrawal.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { withdrawalLimiter } = require('../middleware/rateLimiters');
const { createWithdrawalSchema, listWithdrawalsQuerySchema } = require('../validators/withdrawal.validator');

const router = express.Router();

router.post('/', authenticate, withdrawalLimiter, validate(createWithdrawalSchema), controller.createWithdrawal);
router.get('/', authenticate, validate(listWithdrawalsQuerySchema, 'query'), controller.listWithdrawals);
router.get('/:id', authenticate, controller.getWithdrawal);

module.exports = router;
