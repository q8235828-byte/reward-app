const express = require('express');
const controller = require('../controllers/job.controller');
const { verifyCronSecret } = require('../middleware/verifyCronSecret');
const { validate } = require('../middleware/validate');
const { cronLimiter } = require('../middleware/rateLimiters');
const { processDailyRewardsSchema } = require('../validators/job.validator');

const router = express.Router();

router.post(
  '/jobs/process-daily-rewards',
  cronLimiter,
  verifyCronSecret,
  validate(processDailyRewardsSchema),
  controller.processDailyRewards,
);

module.exports = router;
