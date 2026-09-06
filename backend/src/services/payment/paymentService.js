const jazzCashService = require('./jazzCash.service');
const easypaisaService = require('./easypaisa.service');
const AppError = require('../../utils/AppError');

const PROVIDERS = {
  JAZZCASH: jazzCashService,
  EASYPAISA: easypaisaService,
};

function getProvider(paymentMethod) {
  const provider = PROVIDERS[paymentMethod];
  if (!provider) {
    throw new AppError(400, `Unsupported payment method: ${paymentMethod}`, 'UNSUPPORTED_PAYMENT_METHOD');
  }
  return provider;
}

function getPaymentInstructions(paymentMethod) {
  return getProvider(paymentMethod).getPaymentInstructions();
}

async function verifyPayment(paymentMethod, payload) {
  return getProvider(paymentMethod).verifyPayment(payload);
}

module.exports = { getPaymentInstructions, verifyPayment };
