import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';

export default function WithdrawPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [settings, setSettings] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    amount: '', paymentMethod: 'JAZZCASH', accountName: '', accountNumber: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.get('/wallet'), api.get('/settings'), api.get('/withdrawals?pageSize=10')])
      .then(([walletRes, settingsRes, withdrawalsRes]) => {
        setWallet(walletRes.data.wallet);
        setSettings(settingsRes.data.settings);
        setWithdrawals(withdrawalsRes.data.items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const accountAgeDays = useMemo(() => {
    if (!user?.createdAt) return null;
    return Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }, [user]);

  const isEligibleByAge = Boolean(
    settings && accountAgeDays !== null && accountAgeDays >= settings.withdrawalMinAccountAgeDays,
  );
  const daysRemaining = settings ? Math.max(0, settings.withdrawalMinAccountAgeDays - (accountAgeDays || 0)) : null;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setSubmitting(true);
    try {
      await api.post('/withdrawals', {
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        accountName: form.accountName,
        accountNumber: form.accountNumber,
      });
      setSuccessMessage('Withdrawal request submitted.');
      setForm({
        amount: '', paymentMethod: 'JAZZCASH', accountName: '', accountNumber: '',
      });
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div className="withdraw-page">
      <Link to="/" className="back-link">← Dashboard</Link>
      <h1>Withdraw</h1>

      <section className="balance-card">
        <span className="balance-label">Available to withdraw</span>
        <span className="balance-amount">{formatCurrency(wallet.withdrawableBalance)}</span>
      </section>

      <p className="withdrawal-limits">
        Min {formatCurrency(settings.minimumWithdrawal)} · Max {formatCurrency(settings.maximumWithdrawal)}
      </p>

      {!isEligibleByAge && (
        <p className="eligibility-notice">
          Withdrawals available in {daysRemaining} day(s) (accounts must be at least{' '}
          {settings.withdrawalMinAccountAgeDays} days old).
        </p>
      )}

      <form className="card-form" onSubmit={handleSubmit}>
        <label>
          Amount
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
            min={settings.minimumWithdrawal}
            max={settings.maximumWithdrawal}
          />
        </label>
        <label>
          Payment method
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
            <option value="JAZZCASH">JazzCash</option>
            <option value="EASYPAISA">Easypaisa</option>
          </select>
        </label>
        <label>
          Account holder name
          <input name="accountName" value={form.accountName} onChange={handleChange} required minLength={3} />
        </label>
        <label>
          Account number (mobile number)
          <input
            name="accountNumber"
            value={form.accountNumber}
            onChange={handleChange}
            required
            placeholder="03XXXXXXXXX"
          />
        </label>
        {formError && <p className="form-error">{formError}</p>}
        {successMessage && <p className="form-success">{successMessage}</p>}
        <button type="submit" disabled={submitting || !isEligibleByAge}>
          {submitting ? 'Submitting…' : 'Request withdrawal'}
        </button>
      </form>

      <section className="history-section">
        <h2>Recent withdrawals</h2>
        {withdrawals.length === 0 && <p className="empty-state">No withdrawals yet.</p>}
        <ul className="history-list">
          {withdrawals.map((w) => (
            <li key={w.id} className="history-item">
              <span>{formatCurrency(w.amount)} via {w.paymentMethod}</span>
              <span className={`status-badge status-${w.status.toLowerCase()}`}>{w.status}</span>
              <span className="history-date">{formatDate(w.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
