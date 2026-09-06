import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/format';

const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'];
const EMPTY_FORM = {
  name: '', minAmount: '', maxAmount: '', rewardRate: '', rewardFrequency: 'DAILY', description: '', status: 'ACTIVE',
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/plans')
      .then((res) => setPlans(res.data.plans))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const startEdit = (plan) => {
    setCreating(false);
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      minAmount: plan.minAmount,
      maxAmount: plan.maxAmount,
      rewardRate: plan.rewardRate,
      rewardFrequency: plan.rewardFrequency,
      description: plan.description || '',
      status: plan.status,
    });
    setFormError('');
  };

  const cancelForm = () => {
    setCreating(false);
    setEditingId(null);
  };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const payload = {
      ...form,
      minAmount: Number(form.minAmount),
      maxAmount: Number(form.maxAmount),
      rewardRate: Number(form.rewardRate),
    };
    try {
      if (editingId) {
        await api.patch(`/admin/plans/${editingId}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }
      setCreating(false);
      setEditingId(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showForm = creating || editingId !== null;

  return (
    <div>
      <h1>Plans</h1>
      {!showForm && <button type="button" onClick={startCreate}>+ New plan</button>}

      {showForm && (
        <form className="card-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit plan' : 'New plan'}</h2>
          <label>Name<input name="name" value={form.name} onChange={handleChange} required /></label>
          <label>Min amount<input type="number" name="minAmount" value={form.minAmount} onChange={handleChange} required /></label>
          <label>Max amount<input type="number" name="maxAmount" value={form.maxAmount} onChange={handleChange} required /></label>
          <label>
            Reward rate (%)
            <input type="number" step="0.01" name="rewardRate" value={form.rewardRate} onChange={handleChange} required />
          </label>
          <label>
            Reward frequency
            <select name="rewardFrequency" value={form.rewardFrequency} onChange={handleChange}>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label>Description<input name="description" value={form.description} onChange={handleChange} /></label>
          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          {formError && <p className="form-error">{formError}</p>}
          <div className="row-actions">
            <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}

      {error && <p className="form-error">{error}</p>}
      {loading ? <p>Loading…</p> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Range</th><th>Rate</th><th>Frequency</th><th>Status</th><th /></tr></thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{formatCurrency(p.minAmount)} - {formatCurrency(p.maxAmount)}</td>
                  <td>{p.rewardRate}%</td>
                  <td>{p.rewardFrequency}</td>
                  <td><span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span></td>
                  <td><button type="button" onClick={() => startEdit(p)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
