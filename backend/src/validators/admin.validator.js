const { z } = require('zod');

const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'PENDING'];
const ADMIN_SETTABLE_USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'BLOCKED'];
const DEPOSIT_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'];
const WITHDRAWAL_STATUSES = ['PENDING', 'PROCESSING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'];
const PLAN_STATUSES = ['ACTIVE', 'INACTIVE'];
const PLAN_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'];
const WALLET_FIELDS = ['deposit', 'reward', 'referral', 'withdrawable'];

// --- Users ---

const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).max(191).optional(),
  status: z.enum(USER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const updateUserStatusSchema = z.object({
  status: z.enum(ADMIN_SETTABLE_USER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

const adjustWalletSchema = z.object({
  field: z.enum(WALLET_FIELDS),
  amount: z.coerce.number().refine((val) => val !== 0, 'Amount cannot be zero.'),
  reason: z.string().trim().min(5, 'Provide a reason for this adjustment.').max(500),
});

// --- Deposits / withdrawals (shared shapes) ---

const adminActionNoteSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

const listAllDepositsQuerySchema = z.object({
  status: z.enum(DEPOSIT_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const listAllWithdrawalsQuerySchema = z.object({
  status: z.enum(WITHDRAWAL_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// --- Plans ---

const createPlanSchema = z.object({
  name: z.string().trim().min(2).max(100),
  minAmount: z.coerce.number().positive(),
  maxAmount: z.coerce.number().positive(),
  rewardRate: z.coerce.number().min(0).max(100),
  rewardFrequency: z.enum(PLAN_FREQUENCIES).optional().default('DAILY'),
  durationDays: z.coerce.number().int().positive().optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(PLAN_STATUSES).optional().default('ACTIVE'),
}).refine((data) => data.minAmount <= data.maxAmount, {
  message: 'minAmount must not be greater than maxAmount.',
  path: ['minAmount'],
});

const updatePlanSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  rewardRate: z.coerce.number().min(0).max(100).optional(),
  rewardFrequency: z.enum(PLAN_FREQUENCIES).optional(),
  durationDays: z.coerce.number().int().positive().optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(PLAN_STATUSES).optional(),
});

// --- Settings ---

const ALLOWED_SETTING_KEYS = [
  'withdrawal_min_account_age_days',
  'minimum_withdrawal',
  'maximum_withdrawal',
  'referral_commission_rate',
  'daily_reward_rate',
  'referral_threshold',
  'bonus_enabled',
  'bonus_commission_rate',
  'bonus_reward_multiplier',
  'currency',
  'site_name',
  'logo_url',
  'smtp_host',
  'smtp_port',
  'smtp_secure',
  'smtp_user',
  'smtp_password',
  'mail_from',
];

// logo_url can be a base64 data URI (an uploaded image) - cap it well
// above a typical small logo's encoded size, everything else stays short.
const updateSettingsSchema = z.record(z.string().max(2_000_000))
  .refine((obj) => Object.keys(obj).length > 0, { message: 'Provide at least one setting to update.' })
  .refine(
    (obj) => Object.keys(obj).every((key) => ALLOWED_SETTING_KEYS.includes(key)),
    { message: `Unknown setting key. Allowed keys: ${ALLOWED_SETTING_KEYS.join(', ')}` },
  );

const sendTestEmailSchema = z.object({
  to: z.string().trim().email('Enter a valid email address.'),
});

// --- Referrals / rewards / transactions (global admin views) ---

const REFERRAL_STATUSES = ['NOT_QUALIFIED', 'QUALIFIED', 'ACTIVE', 'SUSPENDED'];
const TRANSACTION_TYPES = ['DEPOSIT', 'REWARD', 'REFERRAL_COMMISSION', 'BONUS', 'WITHDRAWAL', 'REVERSAL', 'ADJUSTMENT'];
const TRANSACTION_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'];

const listAllReferralsQuerySchema = z.object({
  status: z.enum(REFERRAL_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const listAllRewardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const listAllTransactionsQuerySchema = z.object({
  type: z.enum(TRANSACTION_TYPES).optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// --- Audit logs ---

const listAuditLogsQuerySchema = z.object({
  adminId: z.coerce.number().int().positive().optional(),
  action: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = {
  listUsersQuerySchema,
  updateUserStatusSchema,
  adjustWalletSchema,
  adminActionNoteSchema,
  listAllDepositsQuerySchema,
  listAllWithdrawalsQuerySchema,
  createPlanSchema,
  updatePlanSchema,
  updateSettingsSchema,
  sendTestEmailSchema,
  ALLOWED_SETTING_KEYS,
  listAllReferralsQuerySchema,
  listAllRewardsQuerySchema,
  listAllTransactionsQuerySchema,
  listAuditLogsQuerySchema,
};
