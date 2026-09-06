const express = require('express');
const controller = require('../controllers/adminSettings.controller');
const { validate } = require('../middleware/validate');
const { updateSettingsSchema } = require('../validators/admin.validator');

const router = express.Router();

router.get('/', controller.listSettings);
router.patch('/', validate(updateSettingsSchema), controller.updateSettings);
router.post('/test-email', controller.sendTestEmail);

module.exports = router;
