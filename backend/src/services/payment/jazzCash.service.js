const env = require('../../config/env');

// Manual verification only - there is no JazzCash merchant API integration
// yet. getPaymentInstructions() surfaces whatever receiving account an
// admin configured via env vars; verifyPayment() is a placeholder the
// future official integration will replace. Per PMD section 17: never
// fabricate a successful payment response, never auto-approve a deposit
// from user input alone.

function isConfigured() {
  return Boolean(env.payments.jazzCash.accountNumber);
}

function getPaymentInstructions() {
  const { accountTitle, accountNumber } = env.payments.jazzCash;
  return {
    method: 'JAZZCASH',
    configured: isConfigured(),
    accountTitle: accountTitle || null,
    accountNumber: accountNumber || null,
    instructions: isConfigured()
      ? 'Send the exact deposit amount to the JazzCash account above, then submit the transaction reference number from your JazzCash app.'
      : 'JazzCash payment details have not been configured yet. Please contact support.',
  };
}

// Always returns "not verified" - a human admin (or, later, a real
// merchant API callback) is the only thing allowed to confirm payment.
async function verifyPayment() {
  return { verified: false, reason: 'MANUAL_VERIFICATION_REQUIRED' };
}

module.exports = { getPaymentInstructions, verifyPayment, isConfigured };
