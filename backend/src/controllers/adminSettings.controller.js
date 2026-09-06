const settingsService = require('../services/settings.service');
const mailService = require('../services/mail.service');

async function listSettings(req, res, next) {
  try {
    const settings = await settingsService.listAllSettings();
    res.status(200).json({ success: true, data: { settings } });
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req, res, next) {
  try {
    const settings = await settingsService.updateSettings({
      changes: req.body, adminId: req.user.id, ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'Settings updated.', data: { settings } });
  } catch (error) {
    next(error);
  }
}

async function sendTestEmail(req, res, next) {
  try {
    await mailService.sendTestEmail(req.user.email);
    res.status(200).json({ success: true, message: `Test email sent to ${req.user.email}.` });
  } catch (error) {
    next(error);
  }
}

module.exports = { listSettings, updateSettings, sendTestEmail };
