const express = require('express');
const controller = require('../controllers/verification.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { verificationLimiter } = require('../middleware/rateLimiters');
const { confirmCodeSchema } = require('../validators/verification.validator');

const router = express.Router();

router.post('/email/request', authenticate, verificationLimiter, controller.requestEmailCode);
router.post('/email/confirm', authenticate, verificationLimiter, validate(confirmCodeSchema), controller.confirmEmailCode);
router.post('/phone/request', authenticate, verificationLimiter, controller.requestPhoneCode);
router.post('/phone/confirm', authenticate, verificationLimiter, validate(confirmCodeSchema), controller.confirmPhoneCode);

module.exports = router;
