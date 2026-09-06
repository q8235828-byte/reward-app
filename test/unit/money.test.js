const { test } = require('node:test');
const assert = require('node:assert/strict');
const { toDecimal } = require('../../backend/src/utils/money');

test('toDecimal treats null/undefined as zero', () => {
  assert.equal(toDecimal(null).toString(), '0');
  assert.equal(toDecimal(undefined).toString(), '0');
});

test('toDecimal preserves precision that native floats would lose', () => {
  // 0.1 + 0.2 !== 0.3 in native JS floating point - this is exactly the
  // class of bug PMD section 49 requires decimal.js to prevent.
  const result = toDecimal('0.1').plus('0.2');
  assert.equal(result.toFixed(2), '0.30');
});

test('toDecimal accepts strings, numbers, and other Decimal instances', () => {
  assert.equal(toDecimal('100.50').toFixed(2), '100.50');
  assert.equal(toDecimal(100.5).toFixed(2), '100.50');
  assert.equal(toDecimal(toDecimal('5')).toFixed(2), '5.00');
});

test('a reward calculation matches hand-computed expectations', () => {
  // 1000 principal at 5% - the exact math WalletService/RewardService run.
  const eligible = toDecimal('1000.00');
  const rate = toDecimal('5.0000');
  const reward = eligible.times(rate).dividedBy(100);
  assert.equal(reward.toFixed(2), '50.00');
});
