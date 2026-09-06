const express = require('express');
const controller = require('../controllers/adminReferrals.controller');
const { validate } = require('../middleware/validate');
const { listAllReferralsQuerySchema } = require('../validators/admin.validator');

const router = express.Router();

router.get('/', validate(listAllReferralsQuerySchema, 'query'), controller.listReferrals);

module.exports = router;
