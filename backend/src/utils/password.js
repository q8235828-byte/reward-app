const bcrypt = require('bcryptjs');

// bcryptjs (pure JS) is used instead of native bcrypt so installs work
// reliably on Hostinger shared hosting without a native build toolchain.
const SALT_ROUNDS = 10;

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = { hashPassword, comparePassword };
