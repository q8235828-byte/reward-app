const { z } = require('zod');

const PAYMENT_METHODS = ['JAZZCASH', 'EASYPAISA'];
const DEPOSIT_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'];

// A photo/screenshot of the payment receipt, sent as a base64 data URI
// (same upload approach as app_settings.logo_url - no disk storage on
// shared hosting). ~4.2M chars caps the encoded image around 3MB.
const receiptImageSchema = z.string()
  .trim()
  .regex(/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/]+=*$/, 'Receipt must be a PNG, JPG, or WEBP image.')
  .max(4_200_000, 'Receipt image is too large (max 3MB).')
  .optional();

const createDepositSchema = z.object({
  planId: z.coerce.number().int().positive('Select a plan.'),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transactionReference: z.string().trim().min(4).max(100).optional(),
  receiptImage: receiptImageSchema,
});

const submitReferenceSchema = z.object({
  transactionReference: z.string().trim().min(4, 'Enter the transaction reference number.').max(100),
  receiptImage: receiptImageSchema,
});

const listDepositsQuerySchema = z.object({
  status: z.enum(DEPOSIT_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = { createDepositSchema, submitReferenceSchema, listDepositsQuerySchema };
