import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import PasswordInput from '../components/PasswordInput';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/password/reset/confirm', { token, newPassword: form.newPassword });
      showToast('Password reset - please sign in with your new password.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Invalid link</h1>
          <p className="form-error">This reset link is missing its token. Request a new one below.</p>
          <p className="auth-switch"><Link to="/forgot-password">Request a new reset link</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Choose a new password</h1>
        {error && <p className="form-error">{error}</p>}
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
        <button type="submit" disabled={submitting}>{submitting ? 'Resetting…' : 'Reset password'}</button>
        <p className="auth-switch"><Link to="/login">← Back to sign in</Link></p>
      </form>
    </div>
  );
}
