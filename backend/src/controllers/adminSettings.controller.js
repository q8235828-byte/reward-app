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

// Admin accounts no longer carry an email address (login/registration is
// phone-based), so the destination must be typed in rather than defaulted
// to req.user.email.
async function sendTestEmail(req, res, next) {
  try {
    await mailService.sendTestEmail(req.body.to);
    res.status(200).json({ success: true, message: `Test email sent to ${req.body.to}.` });
  } catch (error) {
    next(error);
  }
}

module.exports = { listSettings, updateSettings, sendTestEmail };
