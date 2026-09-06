import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { formatDate } from '../utils/format';
import PasswordInput from '../components/PasswordInput';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/password/change', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      showToast('Password changed - please sign in again.', 'success');
      await refreshUser();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <Link to="/" className="back-link">← Dashboard</Link>
      <h1>Profile</h1>

      <section className="admin-card">
        <h2>Account details</h2>
        <dl className="detail-list">
          <div><dt>Full name</dt><dd>{user.fullName}</dd></div>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Phone</dt><dd>{user.phone}</dd></div>
          <div><dt>Referral code</dt><dd>{user.referralCode}</dd></div>
          <div><dt>Status</dt><dd><span className={`status-badge status-${user.status.toLowerCase()}`}>{user.status}</span></dd></div>
          <div><dt>Member since</dt><dd>{formatDate(user.createdAt)}</dd></div>
        </dl>
      </section>

      <form className="card-form" onSubmit={handleSubmit}>
        <h2>Change password</h2>
        {error && <p className="form-error">{error}</p>}
        <label>
          Current password
          <PasswordInput
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
        </label>
        <label>
          New password
          <PasswordInput
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm new password
          <PasswordInput
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'Updating…' : 'Change password'}</button>
      </form>
    </div>
  );
}
