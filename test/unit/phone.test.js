const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizePhone } = require('../../backend/src/utils/phone');

test('accepts local format unchanged', () => {
  assert.equal(normalizePhone('03001234567'), '03001234567');
});

test('normalizes +92 international format to local', () => {
  assert.equal(normalizePhone('+923001234567'), '03001234567');
});

test('normalizes bare 92-prefixed format to local', () => {
  assert.equal(normalizePhone('923001234567'), '03001234567');
});

test('strips spaces and dashes before validating', () => {
  assert.equal(normalizePhone('0300-123 4567'), '03001234567');
});

test('rejects numbers that are too short', () => {
  assert.equal(normalizePhone('030012345'), null);
});

test('rejects numbers that are too long', () => {
  assert.equal(normalizePhone('030012345678'), null);
});

test('rejects non-mobile-looking numbers (landline-style, not 03x)', () => {
  assert.equal(normalizePhone('02112345678'), null);
});

test('rejects non-numeric input', () => {
  assert.equal(normalizePhone('not-a-phone'), null);
});
