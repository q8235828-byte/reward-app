import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';
import {
  DepositIcon, WithdrawIcon, PlansIcon, ReferralIcon, TransactionsIcon,
} from '../components/icons';

export default function DashboardPage() {
  const [wallet, setWallet] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/wallet'), api.get('/referrals/stats')])
      .then(([walletRes, referralRes]) => {
        if (!active) return;
        setWallet(walletRes.data.wallet);
        setReferralStats(referralRes.data.stats);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralStats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div className="dashboard">
      <section className="balance-card">
        <span className="balance-label">Available to withdraw</span>
        <span className="balance-amount">{formatCurrency(wallet.withdrawableBalance)}</span>
      </section>

      <section className="referral-code-card">
        <span className="referral-code-label">Your referral code</span>
        <span className="referral-code">{referralStats.referralCode}</span>
        <div className="referral-link-row">
          <input readOnly value={referralStats.referralLink} />
          <button type="button" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      </section>

      <section className="stat-grid">
        <div className="stat-tile">
          <span className="stat-label">Deposit balance</span>
          <span className="stat-value">{formatCurrency(wallet.depositBalance)}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Reward balance</span>
          <span className="stat-value">{formatCurrency(wallet.rewardBalance)}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Referral earnings</span>
          <span className="stat-value">{formatCurrency(wallet.referralBalance)}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Total earned</span>
          <span className="stat-value">{formatCurrency(wallet.totalEarned)}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Total withdrawn</span>
          <span className="stat-value">{formatCurrency(wallet.totalWithdrawn)}</span>
        </div>
      </section>

      <nav className="quick-actions">
        <Link to="/deposit" className="action-button"><DepositIcon size={18} />Deposit</Link>
        <Link to="/withdraw" className="action-button"><WithdrawIcon size={18} />Withdraw</Link>
        <Link to="/plans" className="action-button"><PlansIcon size={18} />Plans</Link>
        <Link to="/referral" className="action-button"><ReferralIcon size={18} />Referral</Link>
        <Link to="/transactions" className="action-button"><TransactionsIcon size={18} />Transactions</Link>
      </nav>
    </div>
  );
}
