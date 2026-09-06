const planService = require('../services/plan.service');

async function listPlans(req, res, next) {
  try {
    const plans = await planService.listActivePlans();
    res.status(200).json({ success: true, data: { plans } });
  } catch (error) {
    next(error);
  }
}

module.exports = { listPlans };
