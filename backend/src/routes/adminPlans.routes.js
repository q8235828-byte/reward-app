const express = require('express');
const controller = require('../controllers/adminPlans.controller');
const { validate } = require('../middleware/validate');
const { createPlanSchema, updatePlanSchema } = require('../validators/admin.validator');

const router = express.Router();

router.get('/', controller.listPlans);
router.post('/', validate(createPlanSchema), controller.createPlan);
router.patch('/:id', validate(updatePlanSchema), controller.updatePlan);

module.exports = router;
