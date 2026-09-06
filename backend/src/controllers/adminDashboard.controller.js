const adminDashboardService = require('../services/adminDashboard.service');

async function getDashboard(req, res, next) {
  try {
    const stats = await adminDashboardService.getDashboardStats();
    res.status(200).json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
