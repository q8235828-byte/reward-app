import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import { useBranding } from '../../context/BrandingContext';
import PasswordInput from '../../components/PasswordInput';

const BRANDING_KEYS = ['site_name', 'logo_url'];
const SMTP_KEYS = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_password', 'mail_from'];
const CURATED_KEYS = new Set([...BRANDING_KEYS, ...SMTP_KEYS]);
const MAX_LOGO_BYTES = 500 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function AdminSettingsPage() {
  const { refreshBranding } = useBranding();
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const fileInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/settings')
      .then((res) => {
        setSettings(res.data.settings);
        const initial = {};
        res.data.settings.forEach((s) => { initial[s.setting_key] = s.setting_value; });
        setValues(initial);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Logo must be smaller than 500 KB.');
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    handleChange('logo_url', dataUrl);
  };

  const removeLogo = () => {
    handleChange('logo_url', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await api.patch('/admin/settings', values);
      setMessage('Settings updated.');
      load();
      refreshBranding();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailStatus('');
    setSendingTest(true);
    try {
      const res = await api.post('/admin/settings/test-email');
      setTestEmailStatus(res.message || 'Test email sent.');
    } catch (err) {
      setTestEmailStatus(err.message);
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  const genericSettings = settings.filter((s) => !CURATED_KEYS.has(s.setting_key));

  return (
    <div>
      <h1>Settings</h1>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <form onSubmit={handleSubmit}>
        <div className="admin-card">
          <h2>Branding</h2>
          <p className="setting-description" style={{ marginBottom: '1rem' }}>
            The app name and logo shown across the site, admin panel, and outgoing emails.
          </p>
          <div className="card-form" style={{ boxShadow: 'none', border: 0, padding: 0, marginBottom: 0 }}>
            <label>
              App name
              <input
                value={values.site_name ?? ''}
                onChange={(e) => handleChange('site_name', e.target.value)}
                placeholder="Rewards"
              />
            </label>
            <label>
              Logo
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {values.logo_url ? (
                  <img
                    src={values.logo_url}
                    alt="Logo preview"
                    style={{
                      width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0',
                    }}
                  />
                ) : (
                  <span className="app-logo-mark" style={{ width: 48, height: 48 }} />
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoFile} />
                {values.logo_url && (
                  <button type="button" className="link-button" onClick={removeLogo}>Remove</button>
                )}
              </div>
              {logoError && <span className="form-error" style={{ marginTop: '0.5rem' }}>{logoError}</span>}
              <span className="setting-description">PNG, JPG, or SVG, under 500 KB. Leave empty to use the default mark.</span>
            </label>
          </div>
        </div>

        <div className="admin-card">
          <h2>Email (SMTP)</h2>
          <p className="setting-description" style={{ marginBottom: '1rem' }}>
            Used to send password-reset links and verification codes. Leave a field blank to fall
            back to the SMTP_* environment variables configured on the server.
          </p>
          <div className="card-form" style={{ boxShadow: 'none', border: 0, padding: 0, marginBottom: 0 }}>
            <label>
              SMTP host
              <input
                value={values.smtp_host ?? ''}
                onChange={(e) => handleChange('smtp_host', e.target.value)}
                placeholder="smtp.hostinger.com"
              />
            </label>
            <label>
              SMTP port
              <input
                value={values.smtp_port ?? ''}
                onChange={(e) => handleChange('smtp_port', e.target.value)}
                placeholder="465"
                inputMode="numeric"
              />
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={values.smtp_secure === 'true'}
                onChange={(e) => handleChange('smtp_secure', e.target.checked ? 'true' : 'false')}
              />
              Use TLS/SSL (usually on for port 465)
            </label>
            <label>
              SMTP username
              <input
                value={values.smtp_user ?? ''}
                onChange={(e) => handleChange('smtp_user', e.target.value)}
                placeholder="no-reply@yourdomain.com"
              />
            </label>
            <label>
              SMTP password
              <PasswordInput
                value={values.smtp_password ?? ''}
                onChange={(e) => handleChange('smtp_password', e.target.value)}
              />
            </label>
            <label>
              From address
              <input
                value={values.mail_from ?? ''}
                onChange={(e) => handleChange('mail_from', e.target.value)}
                placeholder="no-reply@yourdomain.com"
              />
            </label>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap',
          }}
          >
            <button type="button" className="link-button" onClick={handleTestEmail} disabled={sendingTest}>
              {sendingTest ? 'Sending…' : 'Send test email to myself'}
            </button>
            {testEmailStatus && <span className="setting-description">{testEmailStatus}</span>}
          </div>
        </div>

        {genericSettings.length > 0 && (
          <div className="admin-card">
            <h2>Business rules</h2>
            <div className="card-form" style={{ boxShadow: 'none', border: 0, padding: 0, marginBottom: 0 }}>
              {genericSettings.map((s) => (
                <label key={s.setting_key}>
                  {s.setting_key}
                  <input
                    value={values[s.setting_key] ?? ''}
                    onChange={(e) => handleChange(s.setting_key, e.target.value)}
                  />
                  {s.description && <span className="setting-description">{s.description}</span>}
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="border-0 bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-lg px-4.5 py-2.5
            font-bold text-sm shadow-md shadow-brand-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
