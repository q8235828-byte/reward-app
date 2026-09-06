const { z } = require('zod');

const PAYMENT_METHODS = ['JAZZCASH', 'EASYPAISA'];
const DEPOSIT_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'];

const createDepositSchema = z.object({
  planId: z.coerce.number().int().positive('Select a plan.'),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transactionReference: z.string().trim().min(4).max(100).optional(),
});

const submitReferenceSchema = z.object({
  transactionReference: z.string().trim().min(4, 'Enter the transaction reference number.').max(100),
});

const listDepositsQuerySchema = z.object({
  status: z.enum(DEPOSIT_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = { createDepositSchema, submitReferenceSchema, listDepositsQuerySchema };
