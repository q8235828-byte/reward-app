const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateReferralCode } = require('../../backend/src/utils/referralCode');

test('generates an 8-character code by default', () => {
  assert.equal(generateReferralCode().length, 8);
});

test('never includes visually ambiguous characters (0, O, 1, I)', () => {
  // A long sample makes an off-by-one in the alphabet/charset far more
  // likely to surface than a single short code would.
  const code = generateReferralCode(500);
  assert.equal(/[01OI]/.test(code), false);
});

test('supports a custom length', () => {
  assert.equal(generateReferralCode(12).length, 12);
});

test('only contains uppercase alphanumeric characters', () => {
  const code = generateReferralCode(50);
  assert.match(code, /^[A-Z0-9]+$/);
});
