import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';
import {
  RocketIcon, PieChartIcon, DiamondIcon, CrownIcon, StarIcon, BoltIcon, CartIcon,
} from '../components/icons';

// Cycled through in order, repeating for however many plans exist -
// purely decorative, no meaning tied to a specific plan.
const PLAN_ICONS = [RocketIcon, PieChartIcon, DiamondIcon, CrownIcon, StarIcon, BoltIcon];

const INTERVAL_LABEL = {
  DAILY: 'Every 24 Hours',
  WEEKLY: 'Every 7 Days',
  MONTHLY: 'Every 30 Days',
};

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
        <div className="plan-dark-grid">
          {plans.map((plan, index) => {
            const PlanIcon = PLAN_ICONS[index % PLAN_ICONS.length];
            const isFixed = Number(plan.minAmount) === Number(plan.maxAmount);
            const dailyProfit = (Number(plan.minAmount) * Number(plan.rewardRate)) / 100;
            const totalReturn = plan.durationDays ? dailyProfit * plan.durationDays : null;

            return (
              <div className="plan-dark-card" key={plan.id}>
                <div className="plan-dark-card-head">
                  <span className="plan-dark-icon"><PlanIcon size={20} /></span>
                  <h2>{plan.name}</h2>
                  <span className="plan-dark-badge">{isFixed ? 'Fixed Amount' : 'Amount range'}</span>
                </div>

                <div className="plan-dark-amount">
                  <span className="plan-dark-amount-value">{formatCurrency(plan.minAmount)}</span>
                  <span className="plan-dark-amount-label">
                    {isFixed ? 'Minimum investment' : `up to ${formatCurrency(plan.maxAmount)}`}
                  </span>
                </div>

                <div className="plan-dark-stats">
                  <div className="plan-dark-stat">
                    <span className="plan-dark-stat-label">Daily profit</span>
                    <span className="plan-dark-stat-value">{formatCurrency(dailyProfit)}</span>
                  </div>
                  <div className="plan-dark-stat">
                    <span className="plan-dark-stat-label">Duration</span>
                    <span className="plan-dark-stat-value">{plan.durationDays ? `${plan.durationDays} Days` : 'Indefinite'}</span>
                  </div>
                  <div className="plan-dark-stat">
                    <span className="plan-dark-stat-label">Total return</span>
                    <span className="plan-dark-stat-value">{totalReturn !== null ? formatCurrency(totalReturn) : '—'}</span>
                  </div>
                  <div className="plan-dark-stat">
                    <span className="plan-dark-stat-label">Interval</span>
                    <span className="plan-dark-stat-value">
                      {INTERVAL_LABEL[plan.rewardFrequency] || plan.rewardFrequency}
                      <small> ({plan.rewardRate}% {plan.rewardFrequency.toLowerCase()})</small>
                    </span>
                  </div>
                </div>

                {plan.description && <p className="plan-dark-description">{plan.description}</p>}

                <Link to={`/deposit?planId=${plan.id}`} className="plan-dark-cta">
                  <CartIcon size={16} />
                  Invest Now
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
