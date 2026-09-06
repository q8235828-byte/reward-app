const express = require('express');
const controller = require('../controllers/plan.controller');

const router = express.Router();

// Public - prospective users can browse plans before registering.
router.get('/', controller.listPlans);

module.exports = router;
