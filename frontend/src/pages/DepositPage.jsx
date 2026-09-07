import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

export default function DepositPage() {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    planId: searchParams.get('planId') || '',
    amount: '',
    paymentMethod: 'JAZZCASH',
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeDeposit, setActiveDeposit] = useState(null);
  const [paymentInstructions, setPaymentInstructions] = useState(null);
  const [referenceInput, setReferenceInput] = useState('');
  const [referenceSubmitting, setReferenceSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.get('/plans'), api.get('/deposits?pageSize=10')])
      .then(([plansRes, depositsRes]) => {
        setPlans(plansRes.data.plans);
        setDeposits(depositsRes.data.items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const selectedPlan = useMemo(
    () => plans.find((p) => String(p.id) === String(form.planId)),
    [plans, form.planId],
  );
  const isFixedAmount = Boolean(selectedPlan) && Number(selectedPlan.minAmount) === Number(selectedPlan.maxAmount);

  // Fixed-amount plans (the norm here - see PlansPage) don't need the user
  // to type an amount at all; keep form.amount in sync with the plan so
  // the existing submit/validation code below doesn't need to change.
  useEffect(() => {
    if (isFixedAmount) {
      setForm((f) => ({ ...f, amount: selectedPlan.minAmount }));
    }
  }, [isFixedAmount, selectedPlan]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await api.post('/deposits', {
        planId: Number(form.planId),
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
      });
      setActiveDeposit(res.data.deposit);
      setPaymentInstructions(res.data.paymentInstructions);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReference = async (e) => {
    e.preventDefault();
    setFormError('');
    setReferenceSubmitting(true);
    try {
      const res = await api.post(`/deposits/${activeDeposit.id}/reference`, {
        transactionReference: referenceInput,
      });
      setActiveDeposit(res.data.deposit);
      setReferenceInput('');
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setReferenceSubmitting(false);
    }
  };

  return (
    <div className="deposit-page">
      <Link to="/" className="back-link">← Dashboard</Link>
      <h1>Deposit</h1>
      {error && <p className="form-error">{error}</p>}

      {loading ? <p>Loading…</p> : (
        <>
          {!activeDeposit && (
            <form className="card-form" onSubmit={handleSubmit}>
              <label>
                Plan
                <select name="planId" value={form.planId} onChange={handleChange} required>
                  <option value="" disabled>Select a plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({Number(plan.minAmount) === Number(plan.maxAmount)
                        ? formatCurrency(plan.minAmount)
                        : `${formatCurrency(plan.minAmount)} - ${formatCurrency(plan.maxAmount)}`})
                    </option>
                  ))}
                </select>
              </label>
              {selectedPlan && (
                <p className="plan-hint">
                  {selectedPlan.rewardRate}% {selectedPlan.rewardFrequency.toLowerCase()} reward.
                  {selectedPlan.description ? ` ${selectedPlan.description}` : ''}
                </p>
              )}
              <label>
                Amount
                {isFixedAmount ? (
                  <input type="text" value={formatCurrency(selectedPlan.minAmount)} readOnly disabled />
                ) : (
                  <input
                    type="number"
                    name="amount"
                    min={selectedPlan?.minAmount || 0}
                    max={selectedPlan?.maxAmount || undefined}
                    value={form.amount}
                    onChange={handleChange}
                    required
                  />
                )}
              </label>
              <label>
                Payment method
                <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="EASYPAISA">Easypaisa</option>
                </select>
              </label>
              {formError && <p className="form-error">{formError}</p>}
              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Create deposit request'}
              </button>
            </form>
          )}

          {activeDeposit && paymentInstructions && (
            <div className="card-form payment-instructions">
              <h2>Payment instructions</h2>
              {paymentInstructions.configured ? (
                <>
                  <p>
                    Send <strong>{formatCurrency(activeDeposit.amount)}</strong> via{' '}
                    {paymentInstructions.method === 'JAZZCASH' ? 'JazzCash' : 'Easypaisa'} to:
                  </p>
                  <p className="payment-account">
                    {paymentInstructions.accountTitle}
                    <br />
                    {paymentInstructions.accountNumber}
                  </p>
                </>
              ) : (
                <p>{paymentInstructions.instructions}</p>
              )}
              <p className="deposit-status">Status: <strong>{activeDeposit.status}</strong></p>

              {['PENDING', 'UNDER_REVIEW'].includes(activeDeposit.status) && (
                <form onSubmit={handleSubmitReference} className="reference-form">
                  <label>
                    Transaction reference number
                    <input
                      value={referenceInput}
                      onChange={(e) => setReferenceInput(e.target.value)}
                      required
                      minLength={4}
                    />
                  </label>
                  {formError && <p className="form-error">{formError}</p>}
                  <button type="submit" disabled={referenceSubmitting}>
                    {referenceSubmitting ? 'Submitting…' : 'Submit reference'}
                  </button>
                </form>
              )}

              <button
                type="button"
                className="link-button"
                onClick={() => { setActiveDeposit(null); setPaymentInstructions(null); }}
              >
                Start a new deposit
              </button>
            </div>
          )}

          <section className="history-section">
            <h2>Recent deposits</h2>
            {deposits.length === 0 && <p className="empty-state">No deposits yet.</p>}
            <ul className="history-list">
              {deposits.map((deposit) => (
                <li key={deposit.id} className="history-item">
                  <span>{formatCurrency(deposit.amount)} via {deposit.paymentMethod}</span>
                  <span className={`status-badge status-${deposit.status.toLowerCase()}`}>{deposit.status}</span>
                  <span className="history-date">{formatDate(deposit.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
