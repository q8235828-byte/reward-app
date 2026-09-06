const crypto = require('crypto');

// Excludes visually ambiguous characters (0/O, 1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReferralCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

module.exports = { generateReferralCode };
