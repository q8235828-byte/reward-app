import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';

export default function DashboardPage() {
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/wallet')
      .then((res) => { if (active) setWallet(res.data.wallet); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div className="dashboard">
      <section className="balance-card">
        <span className="balance-label">Available to withdraw</span>
        <span className="balance-amount">{formatCurrency(wallet.withdrawableBalance)}</span>
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
        <Link to="/deposit" className="action-button">Deposit</Link>
        <Link to="/withdraw" className="action-button">Withdraw</Link>
        <Link to="/plans" className="action-button">Plans</Link>
        <Link to="/referral" className="action-button">Referral</Link>
        <Link to="/transactions" className="action-button">Transactions</Link>
      </nav>
    </div>
  );
}
