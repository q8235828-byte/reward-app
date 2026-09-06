const express = require('express');
const controller = require('../controllers/deposit.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { depositLimiter } = require('../middleware/rateLimiters');
const {
  createDepositSchema, submitReferenceSchema, listDepositsQuerySchema,
} = require('../validators/deposit.validator');

const router = express.Router();

router.post('/', authenticate, depositLimiter, validate(createDepositSchema), controller.createDeposit);
router.post('/:id/reference', authenticate, depositLimiter, validate(submitReferenceSchema), controller.submitReference);
router.get('/', authenticate, validate(listDepositsQuerySchema, 'query'), controller.listDeposits);
router.get('/:id', authenticate, controller.getDeposit);

module.exports = router;
