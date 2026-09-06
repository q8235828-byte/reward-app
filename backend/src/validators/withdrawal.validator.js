const { z } = require('zod');

const PAYMENT_METHODS = ['JAZZCASH', 'EASYPAISA'];
const WITHDRAWAL_STATUSES = ['PENDING', 'PROCESSING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'];

const createWithdrawalSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  paymentMethod: z.enum(PAYMENT_METHODS),
  accountName: z.string().trim().min(3, 'Enter the account holder name.').max(150),
  accountNumber: z.string().trim().min(9, 'Enter a valid account number.').max(20),
});

const listWithdrawalsQuerySchema = z.object({
  status: z.enum(WITHDRAWAL_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = { createWithdrawalSchema, listWithdrawalsQuerySchema };
