import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/format';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setStats(res.data.stats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <section className="stat-grid admin-stat-grid">
        <div className="stat-tile"><span className="stat-label">Total users</span><span className="stat-value">{stats.totalUsers}</span></div>
        <div className="stat-tile"><span className="stat-label">Active users</span><span className="stat-value">{stats.activeUsers}</span></div>
        <div className="stat-tile"><span className="stat-label">Total deposits</span><span className="stat-value">{formatCurrency(stats.totalDeposits)}</span></div>
        <div className="stat-tile"><span className="stat-label">Pending deposits</span><span className="stat-value">{stats.pendingDeposits}</span></div>
        <div className="stat-tile"><span className="stat-label">Approved deposits</span><span className="stat-value">{stats.approvedDeposits}</span></div>
        <div className="stat-tile"><span className="stat-label">Total withdrawals</span><span className="stat-value">{formatCurrency(stats.totalWithdrawals)}</span></div>
        <div className="stat-tile"><span className="stat-label">Pending withdrawals</span><span className="stat-value">{stats.pendingWithdrawals}</span></div>
        <div className="stat-tile"><span className="stat-label">Paid withdrawals</span><span className="stat-value">{stats.paidWithdrawals}</span></div>
        <div className="stat-tile"><span className="stat-label">Total rewards paid</span><span className="stat-value">{formatCurrency(stats.totalRewards)}</span></div>
        <div className="stat-tile"><span className="stat-label">Total referral commissions</span><span className="stat-value">{formatCurrency(stats.totalReferralCommissions)}</span></div>
      </section>
    </div>
  );
}
