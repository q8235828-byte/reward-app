import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED', 'BLOCKED'];
const WALLET_FIELDS = ['deposit', 'reward', 'referral', 'withdrawable'];

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [adjustForm, setAdjustForm] = useState({ field: 'withdrawable', amount: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get(`/admin/users/${id}`),
      api.get(`/admin/users/${id}/deposits?pageSize=5`),
      api.get(`/admin/users/${id}/withdrawals?pageSize=5`),
      api.get(`/admin/users/${id}/referrals?pageSize=5`),
      api.get(`/admin/users/${id}/transactions?pageSize=10`),
    ])
      .then(([detailRes, depositsRes, withdrawalsRes, referralsRes, transactionsRes]) => {
        setDetail(detailRes.data);
        setDeposits(depositsRes.data.items);
        setWithdrawals(withdrawalsRes.data.items);
        setReferrals(referralsRes.data.items);
        setTransactions(transactionsRes.data.items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleStatusChange = async (status) => {
    setActionError('');
    setActionMessage('');
    try {
      await api.post(`/admin/users/${id}/status`, { status, note: statusNote || undefined });
      setActionMessage(`Status updated to ${status}.`);
      setStatusNote('');
      loadAll();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionMessage('');
    setSubmitting(true);
    try {
      await api.post(`/admin/users/${id}/wallet/adjust`, {
        field: adjustForm.field,
        amount: Number(adjustForm.amount),
        reason: adjustForm.reason,
      });
      setActionMessage('Wallet adjusted.');
      setAdjustForm({ field: 'withdrawable', amount: '', reason: '' });
      loadAll();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="form-error">{error}</p>;

  const { user, wallet } = detail;

  return (
    <div>
      <Link to="/admin/users" className="back-link">← Users</Link>
      <h1>{user.fullName}</h1>

      {actionError && <p className="form-error">{actionError}</p>}
      {actionMessage && <p className="form-success">{actionMessage}</p>}

      <section className="admin-card">
        <h2>Profile</h2>
        <dl className="detail-list">
          <div><dt>Phone</dt><dd>{user.phone}</dd></div>
          <div><dt>Referral code</dt><dd>{user.referralCode}</dd></div>
          <div><dt>Role</dt><dd>{user.role}</dd></div>
          <div>
            <dt>Status</dt>
            <dd><span className={`status-badge status-${user.status.toLowerCase()}`}>{user.status}</span></dd>
          </div>
          <div><dt>Joined</dt><dd>{formatDate(user.createdAt)}</dd></div>
          <div><dt>Last login</dt><dd>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</dd></div>
        </dl>
        <div className="status-actions">
          <input placeholder="Note (optional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
          {STATUS_OPTIONS.filter((s) => s !== user.status).map((s) => (
            <button key={s} type="button" onClick={() => handleStatusChange(s)}>Set {s}</button>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h2>Wallet</h2>
        <dl className="detail-list">
          <div><dt>Deposit balance</dt><dd>{formatCurrency(wallet.depositBalance)}</dd></div>
          <div><dt>Reward balance</dt><dd>{formatCurrency(wallet.rewardBalance)}</dd></div>
          <div><dt>Referral balance</dt><dd>{formatCurrency(wallet.referralBalance)}</dd></div>
          <div><dt>Withdrawable balance</dt><dd>{formatCurrency(wallet.withdrawableBalance)}</dd></div>
          <div><dt>Total earned</dt><dd>{formatCurrency(wallet.totalEarned)}</dd></div>
          <div><dt>Total withdrawn</dt><dd>{formatCurrency(wallet.totalWithdrawn)}</dd></div>
        </dl>

        <form className="card-form" onSubmit={handleAdjustSubmit}>
          <h3>Manual adjustment</h3>
          <label>
            Field
            <select
              value={adjustForm.field}
              onChange={(e) => setAdjustForm((f) => ({ ...f, field: e.target.value }))}
            >
              {WALLET_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label>
            Amount (negative to deduct)
            <input
              type="number"
              value={adjustForm.amount}
              onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </label>
          <label>
            Reason
            <input
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
              required
              minLength={5}
            />
          </label>
          <button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Apply adjustment'}</button>
        </form>
      </section>

      <section className="admin-card">
        <h2>Recent deposits</h2>
        {deposits.length === 0 ? <p className="empty-state">None yet.</p> : (
          <ul className="history-list">
            {deposits.map((d) => (
              <li key={d.id} className="history-item">
                <span>{formatCurrency(d.amount)} via {d.paymentMethod}</span>
                <span className={`status-badge status-${d.status.toLowerCase()}`}>{d.status}</span>
                <span className="history-date">{formatDate(d.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-card">
        <h2>Recent withdrawals</h2>
        {withdrawals.length === 0 ? <p className="empty-state">None yet.</p> : (
          <ul className="history-list">
            {withdrawals.map((w) => (
              <li key={w.id} className="history-item">
                <span>{formatCurrency(w.amount)} via {w.paymentMethod}</span>
                <span className={`status-badge status-${w.status.toLowerCase()}`}>{w.status}</span>
                <span className="history-date">{formatDate(w.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-card">
        <h2>Referrals</h2>
        {referrals.length === 0 ? <p className="empty-state">None yet.</p> : (
          <ul className="history-list">
            {referrals.map((r) => (
              <li key={r.id} className="history-item">
                <span>{r.referredUserName}</span>
                <span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status.replace('_', ' ')}</span>
                <span className="history-date">{formatDate(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-card">
        <h2>Recent transactions</h2>
        {transactions.length === 0 ? <p className="empty-state">None yet.</p> : (
          <ul className="history-list">
            {transactions.map((t) => (
              <li key={t.id} className="history-item">
                <span>{t.type.replace('_', ' ')}</span>
                <span className={Number(t.amount) < 0 ? 'amount-negative' : 'amount-positive'}>
                  {formatCurrency(t.amount)}
                </span>
                <span className="history-date">{formatDate(t.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
