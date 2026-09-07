const express = require('express');
const controller = require('../controllers/adminSettings.controller');
const { validate } = require('../middleware/validate');
const { updateSettingsSchema, sendTestEmailSchema } = require('../validators/admin.validator');

const router = express.Router();

router.get('/', controller.listSettings);
router.patch('/', validate(updateSettingsSchema), controller.updateSettings);
router.post('/test-email', validate(sendTestEmailSchema), controller.sendTestEmail);

module.exports = router;
