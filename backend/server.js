const app = require('./src/app');
const env = require('./src/config/env');
const pool = require('./src/config/database');

env.assertRequiredEnvVars();

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
});

// Non-blocking connectivity check: proves the MySQL configuration works
// without preventing the server (and /api/health) from starting.
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully.');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
})();

module.exports = server;
