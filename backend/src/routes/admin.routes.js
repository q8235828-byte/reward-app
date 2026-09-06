const express = require('express');
const { authenticate, authorize } = require('../middleware/authenticate');

const dashboardRoutes = require('./adminDashboard.routes');
const usersRoutes = require('./adminUsers.routes');
const depositsRoutes = require('./adminDeposits.routes');
const withdrawalsRoutes = require('./adminWithdrawals.routes');
const plansRoutes = require('./adminPlans.routes');
const referralsRoutes = require('./adminReferrals.routes');
const rewardsRoutes = require('./adminRewards.routes');
const transactionsRoutes = require('./adminTransactions.routes');
const settingsRoutes = require('./adminSettings.routes');
const auditLogsRoutes = require('./adminAuditLogs.routes');

const router = express.Router();

// Every /api/admin/* route requires an authenticated ADMIN or SUPER_ADMIN -
// applied once here instead of repeated on every sub-route. Role comes
// from req.user, which authenticate() re-loads from the DB every request -
// never trusted from the client (PMD section 9).
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/deposits', depositsRoutes);
router.use('/withdrawals', withdrawalsRoutes);
router.use('/plans', plansRoutes);
router.use('/referrals', referralsRoutes);
router.use('/rewards', rewardsRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit-logs', auditLogsRoutes);

module.exports = router;
