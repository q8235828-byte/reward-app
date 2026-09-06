const express = require('express');
const controller = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  requestResetSchema,
  confirmResetSchema,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);
router.post('/password/change', authenticate, validate(changePasswordSchema), controller.changePassword);
router.post('/password/reset/request', passwordResetLimiter, validate(requestResetSchema), controller.requestPasswordReset);
router.post('/password/reset/confirm', validate(confirmResetSchema), controller.confirmPasswordReset);

module.exports = router;
