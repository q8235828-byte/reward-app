import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await api.patch('/admin/settings', values);
      setMessage('Settings updated.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <h1>Settings</h1>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      <form className="card-form" onSubmit={handleSubmit}>
        {settings.map((s) => (
          <label key={s.setting_key}>
            {s.setting_key}
            <input
              value={values[s.setting_key] ?? ''}
              onChange={(e) => handleChange(s.setting_key, e.target.value)}
            />
            {s.description && <span className="setting-description">{s.description}</span>}
          </label>
        ))}
        <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save settings'}</button>
      </form>
    </div>
  );
}
