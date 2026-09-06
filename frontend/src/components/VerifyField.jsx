import { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

// channel: 'email' | 'phone'. Handles the full request-code -> enter-code
// -> confirm flow for one channel; used twice in ProfilePage.
export default function VerifyField({ channel, verified, destination, onVerified }) {
  const { showToast } = useToast();
  const [stage, setStage] = useState('idle'); // idle | sent
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const label = channel === 'email' ? 'Email' : 'Phone';

  const handleSendCode = async () => {
    setError('');
    setSending(true);
    try {
      const res = await api.post(`/verify/${channel}/request`, {});
      showToast(res.message, 'info');
      setStage('sent');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setConfirming(true);
    try {
      const res = await api.post(`/verify/${channel}/confirm`, { code });
      showToast(res.message, 'success');
      setStage('idle');
      setCode('');
      onVerified();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  if (verified) {
    return (
      <div className="verify-field verify-field-done">
        <span>{label}: {destination}</span>
        <span className="status-badge status-approved">Verified</span>
      </div>
    );
  }

  return (
    <div className="verify-field">
      <div className="verify-field-row">
        <span>{label}: {destination}</span>
        <span className="status-badge status-pending">Not verified</span>
      </div>
      {error && <p className="form-error">{error}</p>}
      {stage === 'idle' ? (
        <button type="button" onClick={handleSendCode} disabled={sending}>
          {sending ? 'Sending…' : `Send verification code`}
        </button>
      ) : (
        <form className="verify-code-form" onSubmit={handleConfirm}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={6}
            required
          />
          <button type="submit" disabled={confirming || code.length !== 6}>
            {confirming ? 'Verifying…' : 'Confirm'}
          </button>
          <button type="button" className="link-button" onClick={handleSendCode} disabled={sending}>
            Resend code
          </button>
        </form>
      )}
    </div>
  );
}
