const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().trim().min(3, 'Full name must be at least 3 characters.').max(150),
  email: z.string().trim().email('Enter a valid email address.').max(191),
  phone: z.string().trim().min(9, 'Enter a valid Pakistani mobile number.').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(72),
  referralCode: z.string().trim().min(4).max(20).optional().or(z.literal('')),
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(72),
});

const requestResetSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

const confirmResetSchema = z.object({
  token: z.string().min(10, 'Reset token is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(72),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  requestResetSchema,
  confirmResetSchema,
};
