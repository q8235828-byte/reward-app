const pool = require('../config/database');
const planRepository = require('../repositories/plan.repository');
const auditLogService = require('./auditLog.service');
const AppError = require('../utils/AppError');
const { toDecimal } = require('../utils/money');

async function listActivePlans() {
  const plans = await planRepository.findAllActive(pool);
  return plans.map(planRepository.sanitizePlan);
}

// Returns the raw DB row (not sanitized) since callers such as the future
// DepositService need min_amount/max_amount for validation, not just the
// public-facing shape.
async function getActivePlanById(planId) {
  const plan = await planRepository.findById(pool, planId);
  if (!plan) throw new AppError(404, 'Plan not found.', 'PLAN_NOT_FOUND');
  if (plan.status !== 'ACTIVE') throw new AppError(400, 'This plan is not currently active.', 'PLAN_INACTIVE');
  return plan;
}

function validateDepositAmount(plan, amount) {
  const value = toDecimal(amount);
  const min = toDecimal(plan.min_amount);
  const max = toDecimal(plan.max_amount);
  if (value.lt(min) || value.gt(max)) {
    throw new AppError(
      400,
      `Amount must be between ${min.toFixed(2)} and ${max.toFixed(2)} for this plan.`,
      'AMOUNT_OUT_OF_RANGE',
    );
  }
}

// --- Admin-facing. Every plan regardless of status, and the write side
// (create/update) that Phase 5 deliberately deferred until audit logging
// existed. ---

async function listAllPlans() {
  const plans = await planRepository.findAll(pool);
  return plans.map(planRepository.sanitizePlan);
}

async function createPlan({
  name, minAmount, maxAmount, rewardRate, rewardFrequency, description, status, adminId, ipAddress,
}) {
  if (toDecimal(minAmount).gt(maxAmount)) {
    throw new AppError(400, 'minAmount must not be greater than maxAmount.', 'INVALID_AMOUNT_RANGE');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const planId = await planRepository.create(connection, {
      name, minAmount, maxAmount, rewardRate, rewardFrequency, description, status,
    });

    await auditLogService.log(connection, {
      adminId,
      action: 'PLAN_CHANGED',
      targetType: 'plan',
      targetId: planId,
      previousValue: null,
      newValue: {
        name, minAmount, maxAmount, rewardRate, rewardFrequency, status,
      },
      ipAddress,
    });

    await connection.commit();

    const plan = await planRepository.findById(pool, planId);
    return planRepository.sanitizePlan(plan);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updatePlan({
  planId, updates, adminId, ipAddress,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const plan = await planRepository.getForUpdate(connection, planId);
    if (!plan) throw new AppError(404, 'Plan not found.', 'PLAN_NOT_FOUND');

    const merged = {
      name: updates.name ?? plan.name,
      minAmount: updates.minAmount ?? plan.min_amount,
      maxAmount: updates.maxAmount ?? plan.max_amount,
      rewardRate: updates.rewardRate ?? plan.reward_rate,
      rewardFrequency: updates.rewardFrequency ?? plan.reward_frequency,
      description: updates.description ?? plan.description,
      status: updates.status ?? plan.status,
    };

    if (toDecimal(merged.minAmount).gt(merged.maxAmount)) {
      throw new AppError(400, 'minAmount must not be greater than maxAmount.', 'INVALID_AMOUNT_RANGE');
    }

    await planRepository.update(connection, planId, merged);

    await auditLogService.log(connection, {
      adminId,
      action: 'PLAN_CHANGED',
      targetType: 'plan',
      targetId: planId,
      previousValue: {
        name: plan.name,
        minAmount: plan.min_amount,
        maxAmount: plan.max_amount,
        rewardRate: plan.reward_rate,
        rewardFrequency: plan.reward_frequency,
        status: plan.status,
      },
      newValue: merged,
      ipAddress,
    });

    await connection.commit();

    const updated = await planRepository.findById(pool, planId);
    return planRepository.sanitizePlan(updated);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listActivePlans, getActivePlanById, validateDepositAmount, listAllPlans, createPlan, updatePlan,
};
