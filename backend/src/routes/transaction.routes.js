const express = require('express');
const controller = require('../controllers/transaction.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { listTransactionsQuerySchema } = require('../validators/transaction.validator');

const router = express.Router();

router.get('/', authenticate, validate(listTransactionsQuerySchema, 'query'), controller.listTransactions);

module.exports = router;
