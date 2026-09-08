-- =====================================================================
-- Hostinger Rewards App - Database Schema
-- Target: MySQL / MariaDB (Hostinger shared hosting)
-- Import this file first via phpMyAdmin, then import seed.sql.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  token_version INT UNSIGNED NOT NULL DEFAULT 0,
  referral_code VARCHAR(20) NOT NULL,
  referred_by BIGINT UNSIGNED DEFAULT NULL,
  role ENUM('USER','ADMIN','SUPER_ADMIN') NOT NULL DEFAULT 'USER',
  status ENUM('ACTIVE','SUSPENDED','BLOCKED','PENDING') NOT NULL DEFAULT 'PENDING',
  last_login DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_referral_code (referral_code),
  KEY idx_users_referred_by (referred_by),
  CONSTRAINT fk_users_referred_by FOREIGN KEY (referred_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- password_reset_tokens
-- token_hash stores SHA-256 of the raw token texted to the user - the
-- raw value is never persisted, matching the password hashing principle.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_tokens_hash (token_hash),
  KEY idx_password_reset_tokens_user (user_id),
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- wallets
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  deposit_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  reward_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  referral_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  withdrawable_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_earned DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_withdrawn DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wallets_user_id (user_id),
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- wallet_transactions (ledger - never delete rows)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('DEPOSIT','REWARD','REFERRAL_COMMISSION','BONUS','WITHDRAWAL','REVERSAL','ADJUSTMENT') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  balance_before DECIMAL(14,2) NOT NULL,
  balance_after DECIMAL(14,2) NOT NULL,
  reference VARCHAR(100) DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  status ENUM('PENDING','COMPLETED','FAILED','REVERSED') NOT NULL DEFAULT 'COMPLETED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wallet_transactions_reference (reference),
  KEY idx_wallet_transactions_user (user_id),
  KEY idx_wallet_transactions_type (type),
  CONSTRAINT fk_wallet_transactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- plans
-- ---------------------------------------------------------------------
-- min_amount/max_amount are kept equal for a fixed-amount plan (the norm
-- for this app - see PlansPage) rather than adding a separate `amount`
-- column; PlanService.validateDepositAmount already enforces an exact
-- match when min = max, so no service-layer change was needed for that.
CREATE TABLE IF NOT EXISTS plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  min_amount DECIMAL(14,2) NOT NULL,
  max_amount DECIMAL(14,2) NOT NULL,
  reward_rate DECIMAL(6,4) NOT NULL COMMENT 'percentage, e.g. 5.0000 = 5%',
  reward_frequency ENUM('DAILY','WEEKLY','MONTHLY') NOT NULL DEFAULT 'DAILY',
  duration_days INT UNSIGNED DEFAULT NULL COMMENT 'Number of days the plan pays rewards for. NULL = indefinite (until admin cancels).',
  description TEXT,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_plans_amount_range CHECK (min_amount <= max_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- user_plans
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  status ENUM('ACTIVE','COMPLETED','CANCELLED','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  started_at DATETIME DEFAULT NULL,
  ended_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_plans_user (user_id),
  KEY idx_user_plans_plan (plan_id),
  KEY idx_user_plans_status (status),
  CONSTRAINT fk_user_plans_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_plans_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- deposits
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deposits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  payment_method ENUM('JAZZCASH','EASYPAISA') NOT NULL,
  transaction_reference VARCHAR(100) DEFAULT NULL,
  -- Base64 data URI of a photo/screenshot of the payment receipt, uploaded
  -- by the user as proof of payment (same storage approach as the
  -- app_settings.logo_url upload - no disk storage on shared hosting).
  receipt_image MEDIUMTEXT DEFAULT NULL,
  status ENUM('PENDING','UNDER_REVIEW','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  admin_note TEXT,
  verified_by BIGINT UNSIGNED DEFAULT NULL,
  verified_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_deposits_user (user_id),
  KEY idx_deposits_plan (plan_id),
  KEY idx_deposits_status (status),
  CONSTRAINT fk_deposits_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_deposits_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE RESTRICT,
  CONSTRAINT fk_deposits_verified_by FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- withdrawals
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  payment_method ENUM('JAZZCASH','EASYPAISA') NOT NULL,
  account_name VARCHAR(150) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  status ENUM('PENDING','PROCESSING','APPROVED','PAID','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  admin_note TEXT,
  processed_by BIGINT UNSIGNED DEFAULT NULL,
  processed_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_withdrawals_user (user_id),
  KEY idx_withdrawals_status (status),
  CONSTRAINT fk_withdrawals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_withdrawals_processed_by FOREIGN KEY (processed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- referrals
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  referrer_id BIGINT UNSIGNED NOT NULL,
  referred_user_id BIGINT UNSIGNED NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  status ENUM('NOT_QUALIFIED','QUALIFIED','ACTIVE','SUSPENDED') NOT NULL DEFAULT 'NOT_QUALIFIED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_referrals_referred_user (referred_user_id),
  KEY idx_referrals_referrer (referrer_id),
  CONSTRAINT fk_referrals_referrer FOREIGN KEY (referrer_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_referrals_referred_user FOREIGN KEY (referred_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- referral_commissions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referral_commissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  referrer_id BIGINT UNSIGNED NOT NULL,
  referred_user_id BIGINT UNSIGNED NOT NULL,
  source_transaction_id BIGINT UNSIGNED DEFAULT NULL,
  commission_type VARCHAR(50) NOT NULL DEFAULT 'DEPOSIT',
  rate DECIMAL(6,4) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  status ENUM('PENDING','PAID','REVERSED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_referral_commissions_source (source_transaction_id, commission_type),
  KEY idx_referral_commissions_referrer (referrer_id),
  KEY idx_referral_commissions_referred_user (referred_user_id),
  CONSTRAINT fk_referral_commissions_referrer FOREIGN KEY (referrer_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_referral_commissions_referred_user FOREIGN KEY (referred_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_referral_commissions_source FOREIGN KEY (source_transaction_id) REFERENCES wallet_transactions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- reward_ledger
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reward_ledger (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  user_plan_id BIGINT UNSIGNED NOT NULL,
  reward_date DATE NOT NULL,
  eligible_amount DECIMAL(14,2) NOT NULL,
  reward_rate DECIMAL(6,4) NOT NULL,
  reward_amount DECIMAL(14,2) NOT NULL,
  status ENUM('PENDING','CREDITED','FAILED') NOT NULL DEFAULT 'CREDITED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reward_ledger_user_plan_date (user_id, user_plan_id, reward_date),
  KEY idx_reward_ledger_user_plan (user_plan_id),
  CONSTRAINT fk_reward_ledger_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_reward_ledger_user_plan FOREIGN KEY (user_plan_id) REFERENCES user_plans (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- app_settings (all business rules are database-driven, not hard-coded)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL,
  -- MEDIUMTEXT (not VARCHAR(255)) because logo_url can hold a base64 data
  -- URI of an uploaded image, not just short config strings.
  setting_value MEDIUMTEXT NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- audit_logs
-- Single audit trail for admin actions (deposit/withdrawal decisions,
-- user status changes, balance adjustments, setting changes, etc).
-- A separate "admin_actions" table was intentionally not added since it
-- would duplicate this same log with no distinct purpose.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id BIGINT UNSIGNED DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) DEFAULT NULL,
  target_id BIGINT UNSIGNED DEFAULT NULL,
  previous_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_admin (admin_id),
  KEY idx_audit_logs_action (action),
  KEY idx_audit_logs_target (target_type, target_id),
  CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Upgrade path for databases that imported this schema before
-- deposits.receipt_image existed. Safe to re-run (IF NOT EXISTS).
-- ---------------------------------------------------------------------
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS receipt_image MEDIUMTEXT DEFAULT NULL AFTER transaction_reference;

SET FOREIGN_KEY_CHECKS = 1;
