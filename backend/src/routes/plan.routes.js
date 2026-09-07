const express = require('express');
const controller = require('../controllers/plan.controller');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

// Public - prospective users can browse plans before registering.
router.get('/', controller.listPlans);

// Authenticated - the current user's own active plan instances (not the
// public catalog above) with progress/reward-cycle stats, for the
// Withdraw page's "Your active plans" section.
router.get('/mine/active', authenticate, controller.listMyActivePlans);

module.exports = router;
