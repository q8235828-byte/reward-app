async function findAllActive(conn) {
  const [rows] = await conn.query("SELECT * FROM plans WHERE status = 'ACTIVE' ORDER BY min_amount ASC");
  return rows;
}

async function findById(conn, id) {
  const [rows] = await conn.query('SELECT * FROM plans WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

// Admin view - every plan regardless of status, unlike findAllActive.
async function findAll(conn) {
  const [rows] = await conn.query('SELECT * FROM plans ORDER BY min_amount ASC');
  return rows;
}

async function getForUpdate(conn, id) {
  const [rows] = await conn.query('SELECT * FROM plans WHERE id = ? FOR UPDATE', [id]);
  return rows[0] || null;
}

async function create(conn, {
  name, minAmount, maxAmount, rewardRate, rewardFrequency, durationDays, description, status,
}) {
  const [result] = await conn.query(
    `INSERT INTO plans (name, min_amount, max_amount, reward_rate, reward_frequency, duration_days, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, minAmount, maxAmount, rewardRate, rewardFrequency, durationDays || null, description || null, status],
  );
  return result.insertId;
}

async function update(conn, id, {
  name, minAmount, maxAmount, rewardRate, rewardFrequency, durationDays, description, status,
}) {
  await conn.query(
    `UPDATE plans SET name = ?, min_amount = ?, max_amount = ?, reward_rate = ?, reward_frequency = ?,
       duration_days = ?, description = ?, status = ?
     WHERE id = ?`,
    [name, minAmount, maxAmount, rewardRate, rewardFrequency, durationDays || null, description || null, status, id],
  );
}

function sanitizePlan(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    minAmount: row.min_amount,
    maxAmount: row.max_amount,
    rewardRate: row.reward_rate,
    rewardFrequency: row.reward_frequency,
    durationDays: row.duration_days,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  findAllActive, findById, findAll, getForUpdate, create, update, sanitizePlan,
};
