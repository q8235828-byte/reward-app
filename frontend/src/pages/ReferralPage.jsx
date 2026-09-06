import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

export default function ReferralPage() {
  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/referrals/stats'), api.get('/referrals?pageSize=20')])
      .then(([statsRes, listRes]) => {
        setStats(statsRes.data.stats);
        setReferrals(listRes.data.items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="form-error">{error}</p>;

  const progress = Math.min(100, (stats.qualifiedReferrals / stats.referralThreshold) * 100);

  return (
    <div className="referral-page">
      <Link to="/" className="back-link">← Dashboard</Link>
      <h1>Referral</h1>

      <section className="referral-code-card">
        <span className="referral-code-label">Your referral code</span>
        <span className="referral-code">{stats.referralCode}</span>
        <div className="referral-link-row">
          <input readOnly value={stats.referralLink} />
          <button type="button" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      </section>

      <section className="stat-grid">
        <div className="stat-tile">
          <span className="stat-label">Total referrals</span>
          <span className="stat-value">{stats.totalReferrals}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Qualifying referrals</span>
          <span className="stat-value">{stats.qualifiedReferrals}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Referral earnings</span>
          <span className="stat-value">{formatCurrency(stats.totalReferralEarnings)}</span>
        </div>
      </section>

      <section className="achievement-card">
        <span>{stats.qualifiedReferrals} / {stats.referralThreshold} qualifying referrals</span>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        {stats.achievementQualified ? (
          <p className="achievement-status achieved">
            Bonus tier unlocked{stats.bonusEnabled ? '' : ' (currently disabled by admin)'}.
          </p>
        ) : (
          <p className="achievement-status">
            Refer {stats.referralThreshold - stats.qualifiedReferrals} more qualifying user(s) to unlock the bonus tier.
          </p>
        )}
      </section>

      <section className="history-section">
        <h2>Your referrals</h2>
        {referrals.length === 0 && <p className="empty-state">No referrals yet - share your link above.</p>}
        <ul className="history-list">
          {referrals.map((r) => (
            <li key={r.id} className="history-item">
              <span>{r.referredUserName}</span>
              <span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status.replace('_', ' ')}</span>
              <span className="history-date">{formatDate(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
