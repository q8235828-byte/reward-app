const express = require('express');
const controller = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

router.get('/', authenticate, controller.getWallet);

module.exports = router;
