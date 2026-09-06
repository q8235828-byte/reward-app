const verificationService = require('../services/verification.service');

async function requestEmailCode(req, res, next) {
  try {
    await verificationService.requestCode({
      userId: req.user.id, channel: 'EMAIL', destination: req.user.email,
    });
    res.status(200).json({ success: true, message: 'Verification code sent to your email.' });
  } catch (error) {
    next(error);
  }
}

async function confirmEmailCode(req, res, next) {
  try {
    await verificationService.confirmCode({ userId: req.user.id, channel: 'EMAIL', code: req.body.code });
    res.status(200).json({ success: true, message: 'Email verified.' });
  } catch (error) {
    next(error);
  }
}

async function requestPhoneCode(req, res, next) {
  try {
    await verificationService.requestCode({
      userId: req.user.id, channel: 'PHONE', destination: req.user.phone,
    });
    res.status(200).json({ success: true, message: 'Verification code sent to your phone.' });
  } catch (error) {
    next(error);
  }
}

async function confirmPhoneCode(req, res, next) {
  try {
    await verificationService.confirmCode({ userId: req.user.id, channel: 'PHONE', code: req.body.code });
    res.status(200).json({ success: true, message: 'Phone number verified.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requestEmailCode, confirmEmailCode, requestPhoneCode, confirmPhoneCode,
};
