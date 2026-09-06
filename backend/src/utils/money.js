const Decimal = require('decimal.js');

// All wallet/ledger math goes through decimal.js instead of native JS
// numbers, so DECIMAL(14,2) columns (returned as strings by mysql2 -
// see config/database.js) are never rounded by floating-point error.
function toDecimal(value) {
  return new Decimal(value === null || value === undefined ? 0 : value);
}

module.exports = { toDecimal, Decimal };
