const { z } = require('zod');

const TRANSACTION_TYPES = ['DEPOSIT', 'REWARD', 'REFERRAL_COMMISSION', 'BONUS', 'WITHDRAWAL', 'REVERSAL', 'ADJUSTMENT'];
const TRANSACTION_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'];

const listTransactionsQuerySchema = z.object({
  type: z.enum(TRANSACTION_TYPES).optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = { listTransactionsQuerySchema };
