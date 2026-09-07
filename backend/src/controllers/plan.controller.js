const planService = require('../services/plan.service');
const userPlanService = require('../services/userPlan.service');

async function listPlans(req, res, next) {
  try {
    const plans = await planService.listActivePlans();
    res.status(200).json({ success: true, data: { plans } });
  } catch (error) {
    next(error);
  }
}

async function listMyActivePlans(req, res, next) {
  try {
    const plans = await userPlanService.listActivePlansForUser(req.user.id);
    res.status(200).json({ success: true, data: { plans } });
  } catch (error) {
    next(error);
  }
}

module.exports = { listPlans, listMyActivePlans };
