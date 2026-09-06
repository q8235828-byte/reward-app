import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    referralCode: searchParams.get('ref') || '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        {error && <p className="form-error">{error}</p>}
        <label>
          Full name
          <input name="fullName" value={form.fullName} onChange={handleChange} required minLength={3} />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Mobile number
          <input name="phone" value={form.phone} onChange={handleChange} required placeholder="03XXXXXXXXX" />
        </label>
        <label>
          Password
          <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} />
        </label>
        <label>
          Referral code (optional)
          <input name="referralCode" value={form.referralCode} onChange={handleChange} />
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
