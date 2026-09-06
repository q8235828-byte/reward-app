const pool = require('../config/database');
const settingRepository = require('../repositories/setting.repository');
const auditLogService = require('./auditLog.service');

// All business rules (withdrawal limits, commission rates, reward rates,
// referral thresholds, ...) are database-driven per PMD section 35 - this
// is the one place that reads app_settings, so no phase hard-codes a rule
// that admin is supposed to be able to change.

async function getRaw(key, fallback = null) {
  const row = await settingRepository.findByKey(pool, key);
  return row ? row.setting_value : fallback;
}

async function getNumber(key, fallback) {
  const raw = await getRaw(key, null);
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isNaN(value) ? fallback : value;
}

async function getBoolean(key, fallback) {
  const raw = await getRaw(key, null);
  if (raw === null) return fallback;
  return raw === 'true' || raw === '1';
}

// --- Admin-facing write path. `changes` keys are pre-validated against an
// allow-list at the route layer (validators/admin.validator.js) - this
// function trusts that and just persists + audits. ---

async function listAllSettings() {
  return settingRepository.findAll(pool);
}

async function updateSettings({ changes, adminId, ipAddress }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const previousValues = {};
    const keys = Object.keys(changes);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      // eslint-disable-next-line no-await-in-loop
      const existing = await settingRepository.findByKey(connection, key);
      previousValues[key] = existing ? existing.setting_value : null;
      // eslint-disable-next-line no-await-in-loop
      await settingRepository.upsert(connection, key, changes[key]);
    }

    await auditLogService.log(connection, {
      adminId,
      action: 'SETTING_CHANGED',
      targetType: 'app_settings',
      previousValue: previousValues,
      newValue: changes,
      ipAddress,
    });

    await connection.commit();

    return await settingRepository.findAll(pool);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getRaw, getNumber, getBoolean, listAllSettings, updateSettings,
};
