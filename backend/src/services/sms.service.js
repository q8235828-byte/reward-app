const env = require('../config/env');
const logger = require('../utils/logger');

function isConfigured() {
  return Boolean(env.sms.apiUrl && env.sms.apiKey);
}

// No specific SMS gateway is integrated - there are many options for
// Pakistani numbers (Twilio, local gateways, etc.) and each has its own
// request shape, so this sends a reasonably generic JSON POST
// { to, message, sender } with a Bearer API key. If your gateway expects
// a different shape, adjust the fetch call below to match its docs -
// nothing else in the app needs to change, since callers only see
// sendSms(phone, message).
async function sendSms(phone, message) {
  if (!isConfigured()) {
    // Matches mail.service.js's fallback when SMTP is unset - log
    // instead of fabricating a successful send.
    console.log(`[DEV] SMS to ${phone}: ${message}`);
    return { sent: false, reason: 'SMS_GATEWAY_NOT_CONFIGURED' };
  }

  try {
    const response = await fetch(env.sms.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.sms.apiKey}`,
      },
      body: JSON.stringify({
        to: phone,
        message,
        sender: env.sms.senderId || undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('SMS_SEND_FAILED', { phone, status: response.status, body: body.slice(0, 300) });
      return { sent: false, reason: 'GATEWAY_ERROR' };
    }

    return { sent: true };
  } catch (error) {
    logger.error('SMS_SEND_FAILED', { phone, message: error.message });
    return { sent: false, reason: 'GATEWAY_UNREACHABLE' };
  }
}

module.exports = { sendSms, isConfigured };
