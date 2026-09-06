const express = require('express');
const controller = require('../controllers/adminTransactions.controller');
const { validate } = require('../middleware/validate');
const { listAllTransactionsQuerySchema } = require('../validators/admin.validator');

const router = express.Router();

router.get('/', validate(listAllTransactionsQuerySchema, 'query'), controller.listTransactions);

module.exports = router;
