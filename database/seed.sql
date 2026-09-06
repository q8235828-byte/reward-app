-- =====================================================================
-- Hostinger Rewards App - Seed Data
-- Import AFTER schema.sql via phpMyAdmin.
-- Amounts are example starting values only - all of it is editable
-- later from the admin panel (Phase 11/13) or directly in app_settings.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Plans (exactly 5, overall range Rs. 250 - Rs. 25,000)
-- ---------------------------------------------------------------------
INSERT INTO plans (name, min_amount, max_amount, reward_rate, reward_frequency, description, status) VALUES
('Starter',  250.00,   2500.00,  5.0000, 'DAILY', 'Entry-level plan for new members.', 'ACTIVE'),
('Bronze',   2501.00,  7500.00,  5.0000, 'DAILY', 'For members ready to grow their deposit.', 'ACTIVE'),
('Silver',   7501.00,  12500.00, 5.0000, 'DAILY', 'Mid-tier plan with higher deposit range.', 'ACTIVE'),
('Gold',     12501.00, 20000.00, 5.0000, 'DAILY', 'High-tier plan for larger deposits.', 'ACTIVE'),
('Platinum', 20001.00, 25000.00, 5.0000, 'DAILY', 'Top-tier plan, maximum deposit range.', 'ACTIVE');

-- ---------------------------------------------------------------------
-- App settings (all business rules, per PMD section 35)
-- ---------------------------------------------------------------------
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
('withdrawal_min_account_age_days', '14',    'Minimum account age in days before a withdrawal can be requested.'),
('minimum_withdrawal',              '500',   'Minimum withdrawal amount.'),
('maximum_withdrawal',              '25000', 'Maximum withdrawal amount.'),
('referral_commission_rate',        '10.00', 'Referral commission percentage on qualifying deposits.'),
('daily_reward_rate',               '5.00',  'Default daily reward percentage (can be overridden per plan).'),
('referral_threshold',              '5',     'Number of qualifying referrals required for the bonus tier.'),
('bonus_enabled',                   'false', 'Whether the 5+ referral bonus tier is active.'),
('bonus_commission_rate',           '0.00',  'Extra referral commission percentage once the threshold is met.'),
('bonus_reward_multiplier',         '1.00',  'Multiplier applied to rewards once the threshold is met.'),
('currency',                        'PKR',   'Application currency code.');

-- ---------------------------------------------------------------------
-- Initial admin account (OPTIONAL - development only)
--
-- Do NOT uncomment and run this with a real production password.
-- password_hash must be a bcrypt hash, never plaintext. Generate one
-- locally once Phase 3 (authentication) adds the hashing dependency,
-- e.g. via: node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
-- then paste the resulting hash below before running this insert.
-- ---------------------------------------------------------------------
-- INSERT INTO users (full_name, email, phone, password_hash, referral_code, role, status)
-- VALUES ('Admin User', 'admin@example.com', '03000000000', '<bcrypt-hash-here>', 'ADMIN0001', 'SUPER_ADMIN', 'ACTIVE');
