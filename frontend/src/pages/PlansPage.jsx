import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/plans')
      .then((res) => setPlans(res.data.plans))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="plans-page">
      <Link to="/" className="back-link">← Dashboard</Link>
      <h1>Plans</h1>

      {error && <p className="form-error">{error}</p>}
      {loading ? <p>Loading…</p> : (
        <div className="plan-list">
          {plans.map((plan) => (
            <div className="plan-card" key={plan.id}>
              <h2>{plan.name}</h2>
              <p className="plan-range">
                {formatCurrency(plan.minAmount)} - {formatCurrency(plan.maxAmount)}
              </p>
              <p className="plan-rate">
                {plan.rewardRate}% {plan.rewardFrequency.toLowerCase()} reward
              </p>
              {plan.description && <p className="plan-description">{plan.description}</p>}
              <Link to={`/deposit?planId=${plan.id}`} className="action-button">Deposit into this plan</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
