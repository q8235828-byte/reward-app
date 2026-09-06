import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import {
  UsersIcon, DepositIcon, WithdrawIcon, GiftIcon, ReferralIcon, ShieldIcon,
} from '../../components/icons';

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

  const cards = [
    {
      icon: UsersIcon, color: 'teal',
      label: 'Total users', value: stats.totalUsers, sub: `${stats.activeUsers} active`,
    },
    {
      icon: DepositIcon, color: 'blue',
      label: 'Total deposits', value: formatCurrency(stats.totalDeposits), sub: `${stats.approvedDeposits} approved`,
    },
    {
      icon: WithdrawIcon, color: 'amber',
      label: 'Total withdrawals', value: formatCurrency(stats.totalWithdrawals), sub: `${stats.paidWithdrawals} paid`,
    },
    {
      icon: ShieldIcon, color: 'rose',
      label: 'Pending deposits', value: stats.pendingDeposits, sub: 'awaiting review',
    },
    {
      icon: ShieldIcon, color: 'rose',
      label: 'Pending withdrawals', value: stats.pendingWithdrawals, sub: 'awaiting review',
    },
    {
      icon: GiftIcon, color: 'violet',
      label: 'Total rewards paid', value: formatCurrency(stats.totalRewards), sub: 'daily reward engine',
    },
    {
      icon: ReferralIcon, color: 'emerald',
      label: 'Referral commissions', value: formatCurrency(stats.totalReferralCommissions), sub: 'paid to referrers',
    },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <section className="stat-card-grid">
        {cards.map((card) => {
          const CardIcon = card.icon;
          return (
            <div className="stat-card" key={card.label}>
              <span className={`stat-card-icon stat-card-icon-${card.color}`}>
                <CardIcon size={19} />
              </span>
              <div className="stat-card-body">
                <span className="stat-card-label">{card.label}</span>
                <span className="stat-card-value">{card.value}</span>
                <span className="stat-card-sub">{card.sub}</span>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
