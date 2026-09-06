const planService = require('../services/plan.service');
const AppError = require('../utils/AppError');

function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'Invalid plan id.', 'INVALID_ID');
  }
  return id;
}

async function listPlans(req, res, next) {
  try {
    const plans = await planService.listAllPlans();
    res.status(200).json({ success: true, data: { plans } });
  } catch (error) {
    next(error);
  }
}

async function createPlan(req, res, next) {
  try {
    const plan = await planService.createPlan({
      ...req.body, adminId: req.user.id, ipAddress: req.ip,
    });
    res.status(201).json({ success: true, message: 'Plan created.', data: { plan } });
  } catch (error) {
    next(error);
  }
}

async function updatePlan(req, res, next) {
  try {
    const planId = parseId(req.params.id);
    const plan = await planService.updatePlan({
      planId, updates: req.body, adminId: req.user.id, ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'Plan updated.', data: { plan } });
  } catch (error) {
    next(error);
  }
}

module.exports = { listPlans, createPlan, updatePlan };
