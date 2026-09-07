import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/password/reset/request', { phone });
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
            If that mobile number is registered, a reset link has been sent via SMS. It's valid
            for the next hour.
          </p>
        ) : (
          <>
            <p className="auth-helper">Enter your mobile number and we'll text you a link to reset your password.</p>
            {error && <p className="form-error">{error}</p>}
            <label>
              Mobile number
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required autoFocus placeholder="03XXXXXXXXX" />
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
