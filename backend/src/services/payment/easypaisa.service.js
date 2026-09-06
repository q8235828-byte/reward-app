const env = require('../../config/env');

// Same manual-verification model as jazzCash.service.js - see the comment
// there. Kept as an independent module so Easypaisa's future official API
// integration can be configured/implemented without touching JazzCash.

function isConfigured() {
  return Boolean(env.payments.easypaisa.accountNumber);
}

function getPaymentInstructions() {
  const { accountTitle, accountNumber } = env.payments.easypaisa;
  return {
    method: 'EASYPAISA',
    configured: isConfigured(),
    accountTitle: accountTitle || null,
    accountNumber: accountNumber || null,
    instructions: isConfigured()
      ? 'Send the exact deposit amount to the Easypaisa account above, then submit the transaction reference number from your Easypaisa app.'
      : 'Easypaisa payment details have not been configured yet. Please contact support.',
  };
}

async function verifyPayment() {
  return { verified: false, reason: 'MANUAL_VERIFICATION_REQUIRED' };
}

module.exports = { getPaymentInstructions, verifyPayment, isConfigured };
