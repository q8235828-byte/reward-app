const express = require('express');
const controller = require('../controllers/adminRewards.controller');
const { validate } = require('../middleware/validate');
const { listAllRewardsQuerySchema } = require('../validators/admin.validator');

const router = express.Router();

router.get('/', validate(listAllRewardsQuerySchema, 'query'), controller.listRewards);

module.exports = router;
