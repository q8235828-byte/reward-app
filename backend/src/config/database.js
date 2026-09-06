const mysql = require('mysql2/promise');
const env = require('./env');

// decimalNumbers: false keeps DECIMAL columns as strings instead of JS
// floating-point numbers, so monetary values are never silently rounded.
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: false,
});

module.exports = pool;
