const pool = require('../config/database');
const walletRepository = require('../repositories/wallet.repository');
const walletTransactionRepository = require('../repositories/walletTransaction.repository');
const AppError = require('../utils/AppError');
const { toDecimal } = require('../utils/money');

// Every function below (except the two read helpers) takes an explicit
// `conn` - a connection with a transaction already started by the caller
// (e.g. DepositService approving a deposit also activates a plan in the
// same transaction, per PMD section 32). WalletService never opens its
// own transaction, so it can be composed into larger atomic operations.

const BALANCE_COLUMNS = {
  deposit: 'deposit_balance',
  reward: 'reward_balance',
  referral: 'referral_balance',
  withdrawable: 'withdrawable_balance',
};

function decimalDeltas(wallet, deltas) {
  return {
    depositBalance: toDecimal(wallet.deposit_balance).plus(deltas.deltaDeposit || 0),
    rewardBalance: toDecimal(wallet.reward_balance).plus(deltas.deltaReward || 0),
    referralBalance: toDecimal(wallet.referral_balance).plus(deltas.deltaReferral || 0),
    withdrawableBalance: toDecimal(wallet.withdrawable_balance).plus(deltas.deltaWithdrawable || 0),
    totalEarned: toDecimal(wallet.total_earned).plus(deltas.deltaTotalEarned || 0),
    totalWithdrawn: toDecimal(wallet.total_withdrawn).plus(deltas.deltaTotalWithdrawn || 0),
  };
}

/**
 * The single primitive every credit/debit/adjustment/reversal goes
 * through. Locks the wallet row, validates no balance goes negative,
 * writes the immutable ledger row, then updates the running balances.
 * Idempotent: a repeated call with the same `reference` returns the
 * transaction that reference already produced instead of applying it
 * again (PMD section 51).
 */
async function applyTransaction(conn, {
  userId, type, amount, primaryField, reference = null, description = null, status = 'COMPLETED', ...deltas
}) {
  const wallet = await walletRepository.getForUpdate(conn, userId);
  if (!wallet) throw new AppError(404, 'Wallet not found.', 'WALLET_NOT_FOUND');

  const next = decimalDeltas(wallet, deltas);
  const negativeField = Object.entries(next).find(([, value]) => value.isNegative());
  if (negativeField) {
    throw new AppError(400, 'This operation would result in a negative wallet balance.', 'INSUFFICIENT_BALANCE');
  }

  const primaryColumn = BALANCE_COLUMNS[primaryField];
  if (!primaryColumn) {
    throw new AppError(500, `Unknown wallet field: ${primaryField}`, 'INVALID_WALLET_FIELD');
  }
  const balanceBefore = toDecimal(wallet[primaryColumn]);
  const balanceAfter = balanceBefore.plus(amount);

  let transactionId;
  try {
    transactionId = await walletTransactionRepository.insert(conn, {
      userId,
      type,
      amount: toDecimal(amount).toFixed(2),
      balanceBefore: balanceBefore.toFixed(2),
      balanceAfter: balanceAfter.toFixed(2),
      reference,
      description,
      status,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' && reference) {
      const existing = await walletTransactionRepository.findByReference(conn, reference);
      if (existing) return walletTransactionRepository.sanitizeTransaction(existing);
    }
    throw error;
  }

  await walletRepository.updateBalances(conn, userId, {
    depositBalance: next.depositBalance.toFixed(2),
    rewardBalance: next.rewardBalance.toFixed(2),
    referralBalance: next.referralBalance.toFixed(2),
    withdrawableBalance: next.withdrawableBalance.toFixed(2),
    totalEarned: next.totalEarned.toFixed(2),
    totalWithdrawn: next.totalWithdrawn.toFixed(2),
  });

  const inserted = await walletTransactionRepository.findById(conn, transactionId);
  return walletTransactionRepository.sanitizeTransaction(inserted);
}

// Deposit principal - increases deposit_balance only. Not withdrawable by
// itself; it's tied up in the plan until the plan completes/cancels.
async function creditDeposit(conn, {
  userId, amount, reference, description,
}) {
  return applyTransaction(conn, {
    userId, type: 'DEPOSIT', amount, primaryField: 'deposit', reference, description, deltaDeposit: amount,
  });
}

async function creditReward(conn, {
  userId, amount, reference, description,
}) {
  return applyTransaction(conn, {
    userId,
    type: 'REWARD',
    amount,
    primaryField: 'withdrawable',
    reference,
    description,
    deltaReward: amount,
    deltaWithdrawable: amount,
    deltaTotalEarned: amount,
  });
}

async function creditReferralCommission(conn, {
  userId, amount, reference, description,
}) {
  return applyTransaction(conn, {
    userId,
    type: 'REFERRAL_COMMISSION',
    amount,
    primaryField: 'withdrawable',
    reference,
    description,
    deltaReferral: amount,
    deltaWithdrawable: amount,
    deltaTotalEarned: amount,
  });
}

async function creditBonus(conn, {
  userId, amount, reference, description,
}) {
  return applyTransaction(conn, {
    userId,
    type: 'BONUS',
    amount,
    primaryField: 'withdrawable',
    reference,
    description,
    deltaWithdrawable: amount,
    deltaTotalEarned: amount,
  });
}

// amount is the positive withdrawal magnitude; stored ledger amount is
// negative (money leaving the wallet) so balance_after = balance_before + amount always holds.
async function debitWithdrawal(conn, {
  userId, amount, reference, description,
}) {
  const negativeAmount = toDecimal(amount).negated();
  return applyTransaction(conn, {
    userId,
    type: 'WITHDRAWAL',
    amount: negativeAmount,
    primaryField: 'withdrawable',
    reference,
    description,
    deltaWithdrawable: negativeAmount,
    deltaTotalWithdrawn: amount,
  });
}

// Manual admin correction on a single balance field. Deliberately does not
// touch total_earned/total_withdrawn - the admin's description carries the
// intent, and callers needing those side effects should use a credit/debit
// helper instead.
async function adjustBalance(conn, {
  userId, field, amount, reference, description,
}) {
  if (!BALANCE_COLUMNS[field]) {
    throw new AppError(400, `Invalid wallet field: ${field}`, 'INVALID_WALLET_FIELD');
  }
  const deltaKey = `delta${field.charAt(0).toUpperCase()}${field.slice(1)}`;
  return applyTransaction(conn, {
    userId, type: 'ADJUSTMENT', amount, primaryField: field, reference, description, [deltaKey]: amount,
  });
}

const REVERSAL_PRIMARY_FIELD = {
  DEPOSIT: 'deposit', REWARD: 'withdrawable', REFERRAL_COMMISSION: 'withdrawable', BONUS: 'withdrawable', WITHDRAWAL: 'withdrawable',
};

// Reverses a DEPOSIT/REWARD/REFERRAL_COMMISSION/BONUS/WITHDRAWAL transaction
// by undoing exactly the fields it touched. ADJUSTMENT and REVERSAL rows
// cannot be auto-reversed - a targeted field is ambiguous for ADJUSTMENT,
// and a reversal of a reversal should be a fresh, explicit adjustment.
async function reverseTransaction(conn, { originalTransactionId, description }) {
  const original = await walletTransactionRepository.findById(conn, originalTransactionId);
  if (!original) throw new AppError(404, 'Original transaction not found.', 'TRANSACTION_NOT_FOUND');

  const primaryField = REVERSAL_PRIMARY_FIELD[original.type];
  if (!primaryField) {
    throw new AppError(400, `Transactions of type ${original.type} cannot be reversed automatically.`, 'INVALID_REVERSAL');
  }

  const reference = `REV-${original.id}`;
  const existing = await walletTransactionRepository.findByReference(conn, reference);
  if (existing) return walletTransactionRepository.sanitizeTransaction(existing);

  const inverseAmount = toDecimal(original.amount).negated();
  const deltas = {};
  if (original.type === 'DEPOSIT') {
    deltas.deltaDeposit = inverseAmount;
  } else if (original.type === 'REWARD') {
    deltas.deltaReward = inverseAmount;
    deltas.deltaWithdrawable = inverseAmount;
    deltas.deltaTotalEarned = inverseAmount;
  } else if (original.type === 'REFERRAL_COMMISSION') {
    deltas.deltaReferral = inverseAmount;
    deltas.deltaWithdrawable = inverseAmount;
    deltas.deltaTotalEarned = inverseAmount;
  } else if (original.type === 'BONUS') {
    deltas.deltaWithdrawable = inverseAmount;
    deltas.deltaTotalEarned = inverseAmount;
  } else if (original.type === 'WITHDRAWAL') {
    // original.amount is already negative, so adding it back reduces
    // total_withdrawn by the withdrawn magnitude.
    deltas.deltaWithdrawable = inverseAmount;
    deltas.deltaTotalWithdrawn = toDecimal(original.amount);
  }

  return applyTransaction(conn, {
    userId: original.user_id,
    type: 'REVERSAL',
    amount: inverseAmount,
    primaryField,
    reference,
    description: description || `Reversal of transaction #${original.id}`,
    ...deltas,
  });
}

async function getWalletByUserId(userId) {
  const wallet = await walletRepository.getByUserId(pool, userId);
  if (!wallet) throw new AppError(404, 'Wallet not found.', 'WALLET_NOT_FOUND');
  return walletRepository.sanitizeWallet(wallet);
}

async function listTransactions(userId, {
  type, status, page = 1, pageSize = 20,
}) {
  const [items, total] = await Promise.all([
    walletTransactionRepository.listByUser(pool, userId, {
      type, status, page, pageSize,
    }),
    walletTransactionRepository.countByUser(pool, userId, { type, status }),
  ]);
  return {
    items: items.map(walletTransactionRepository.sanitizeTransaction),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

// Admin view - across every user, unlike listTransactions (one user).
async function listAllTransactions({
  type, status, page = 1, pageSize = 20,
}) {
  const [items, total] = await Promise.all([
    walletTransactionRepository.listAllAdmin(pool, {
      type, status, page, pageSize,
    }),
    walletTransactionRepository.countAllAdmin(pool, { type, status }),
  ]);
  return {
    items: items.map(walletTransactionRepository.sanitizeTransaction),
    pagination: {
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

module.exports = {
  applyTransaction,
  creditDeposit,
  creditReward,
  creditReferralCommission,
  creditBonus,
  debitWithdrawal,
  adjustBalance,
  reverseTransaction,
  getWalletByUserId,
  listTransactions,
  listAllTransactions,
};
