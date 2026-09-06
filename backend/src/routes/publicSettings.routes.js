const express = require('express');
const controller = require('../controllers/publicSettings.controller');

const router = express.Router();

router.get('/', controller.getPublicSettings);

module.exports = router;
