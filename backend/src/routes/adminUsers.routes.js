const express = require('express');
const controller = require('../controllers/adminUsers.controller');
const { validate } = require('../middleware/validate');
const {
  listUsersQuerySchema, updateUserStatusSchema, adjustWalletSchema,
} = require('../validators/admin.validator');
const { listTransactionsQuerySchema } = require('../validators/transaction.validator');
const { listDepositsQuerySchema } = require('../validators/deposit.validator');
const { listWithdrawalsQuerySchema } = require('../validators/withdrawal.validator');
const { listReferralsQuerySchema } = require('../validators/referral.validator');

const router = express.Router();

router.get('/', validate(listUsersQuerySchema, 'query'), controller.listUsers);
router.get('/:id', controller.getUser);
router.post('/:id/status', validate(updateUserStatusSchema), controller.updateUserStatus);
router.get('/:id/wallet', controller.getUserWallet);
router.post('/:id/wallet/adjust', validate(adjustWalletSchema), controller.adjustUserWallet);
router.get('/:id/transactions', validate(listTransactionsQuerySchema, 'query'), controller.getUserTransactions);
router.get('/:id/deposits', validate(listDepositsQuerySchema, 'query'), controller.getUserDeposits);
router.get('/:id/withdrawals', validate(listWithdrawalsQuerySchema, 'query'), controller.getUserWithdrawals);
router.get('/:id/referrals', validate(listReferralsQuerySchema, 'query'), controller.getUserReferrals);

module.exports = router;
