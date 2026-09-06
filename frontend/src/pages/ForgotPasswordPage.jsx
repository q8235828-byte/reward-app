import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/password/reset/request', { email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Reset your password</h1>
        {sent ? (
          <p className="form-success">
            If that email is registered, a reset link has been sent. Check your inbox (and spam
            folder) for a link valid for the next hour.
          </p>
        ) : (
          <>
            <p className="auth-helper">Enter your email and we'll send you a link to reset your password.</p>
            {error && <p className="form-error">{error}</p>}
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </label>
            <button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send reset link'}</button>
          </>
        )}
        <p className="auth-switch">
          <Link to="/login">← Back to sign in</Link>
        </p>
      </form>
    </div>
  );
}
