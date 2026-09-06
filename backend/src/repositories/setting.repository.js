async function findByKey(conn, key) {
  const [rows] = await conn.query('SELECT * FROM app_settings WHERE setting_key = ? LIMIT 1', [key]);
  return rows[0] || null;
}

async function findAll(conn) {
  const [rows] = await conn.query('SELECT * FROM app_settings ORDER BY setting_key ASC');
  return rows;
}

async function upsert(conn, key, value) {
  await conn.query(
    `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, value],
  );
}

module.exports = { findByKey, findAll, upsert };
