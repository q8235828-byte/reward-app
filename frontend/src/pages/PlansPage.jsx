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
        <div className="plan-fixed-grid">
          {plans.map((plan, index) => {
            const PlanIcon = PLAN_ICONS[index % PLAN_ICONS.length];
            const isFixed = Number(plan.minAmount) === Number(plan.maxAmount);
            const rewardRate = Number(plan.rewardRate);
            const dailyProfit = (Number(plan.minAmount) * rewardRate) / 100;
            const totalReturn = plan.durationDays ? dailyProfit * plan.durationDays : null;

            return (
              <div className="plan-fixed-card" key={plan.id}>
                <div className="plan-fixed-card-head">
                  <span className="plan-fixed-icon"><PlanIcon size={20} /></span>
                  <div className="plan-fixed-card-title">
                    <h2>{plan.name}</h2>
                    <span className="plan-fixed-badge">{isFixed ? 'Fixed Amount' : 'Amount range'}</span>
                  </div>
                </div>

                <div className="plan-fixed-amount">
                  <span className="plan-fixed-amount-value">{formatCurrency(plan.minAmount)}</span>
                  <span className="plan-fixed-amount-label">
                    {isFixed ? 'Minimum investment' : `up to ${formatCurrency(plan.maxAmount)}`}
                  </span>
                </div>

                <div className="plan-fixed-stats">
                  <div className="plan-fixed-stat-row">
                    <span>Daily profit</span>
                    <strong>{formatCurrency(dailyProfit)}</strong>
                  </div>
                  <div className="plan-fixed-stat-row">
                    <span>Duration</span>
                    <strong>{plan.durationDays ? `${plan.durationDays} days` : 'Indefinite'}</strong>
                  </div>
                  <div className="plan-fixed-stat-row">
                    <span>Total return</span>
                    <strong>{totalReturn !== null ? formatCurrency(totalReturn) : '—'}</strong>
                  </div>
                  <div className="plan-fixed-stat-row">
                    <span>Reward rate</span>
                    <strong>{rewardRate}% {plan.rewardFrequency.toLowerCase()}</strong>
                  </div>
                </div>

                {plan.description && <p className="plan-fixed-description">{plan.description}</p>}

                <Link to={`/deposit?planId=${plan.id}`} className="plan-fixed-cta">
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
