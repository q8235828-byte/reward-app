const express = require('express');
const controller = require('../controllers/referral.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { listReferralsQuerySchema } = require('../validators/referral.validator');

const router = express.Router();

router.get('/stats', authenticate, controller.getStats);
router.get('/', authenticate, validate(listReferralsQuerySchema, 'query'), controller.listReferrals);

module.exports = router;
