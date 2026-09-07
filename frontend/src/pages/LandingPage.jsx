import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import {
  DepositIcon, GiftIcon, ReferralIcon, ShieldIcon, WithdrawIcon, PlansIcon,
} from '../components/icons';

const STEPS = [
  { icon: PlansIcon, title: 'Choose a plan', text: 'Pick from 5 plans covering Rs. 250 to Rs. 25,000, each with its own reward rate.' },
  { icon: DepositIcon, title: 'Deposit via JazzCash or Easypaisa', text: 'Submit your deposit, pay, and share the transaction reference for verification.' },
  { icon: GiftIcon, title: 'Earn daily rewards', text: 'Once approved, your plan earns rewards on its schedule, credited straight to your wallet.' },
  { icon: WithdrawIcon, title: 'Withdraw your earnings', text: 'Request a withdrawal any time after your account meets the minimum age requirement.' },
];

export default function LandingPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api.get('/plans').then((res) => setPlans(res.data.plans)).catch(() => setPlans([]));
  }, []);

  return (
    <div className="landing-page">
      <PublicHeader />

      <section className="landing-hero">
        <h1>Deposit, earn daily rewards, and grow with referrals</h1>
        <p>
          A straightforward rewards platform: choose a plan, deposit via JazzCash or Easypaisa,
          and track everything - deposits, daily rewards, referral commissions, and withdrawals -
          in one place.
        </p>
        <div className="landing-hero-actions">
          <Link to="/register" className="landing-cta">Create your account</Link>
          <Link to="/login" className="landing-cta-outline">I already have an account</Link>
        </div>
        <p className="landing-disclaimer">
          Rewards and commission rates are set by the platform and can change - this is not a
          guaranteed-return investment product.
        </p>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">How it works</h2>
        <div className="landing-steps">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div className="landing-step" key={step.title}>
                <span className="landing-step-number">{index + 1}</span>
                <StepIcon size={22} />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {plans.length > 0 && (
        <section className="landing-section">
          <h2 className="landing-section-title">Plans</h2>
          <div className="plan-list landing-plan-list">
            {plans.map((plan) => (
              <div className="plan-card" key={plan.id}>
                <h2>{plan.name}</h2>
                <p className="plan-range">
                  {Number(plan.minAmount) === Number(plan.maxAmount)
                    ? formatCurrency(plan.minAmount)
                    : `${formatCurrency(plan.minAmount)} - ${formatCurrency(plan.maxAmount)}`}
                </p>
                <p className="plan-rate">{plan.rewardRate}% {plan.rewardFrequency.toLowerCase()} reward</p>
                {plan.description && <p className="plan-description">{plan.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="landing-section">
        <h2 className="landing-section-title">Why people use it</h2>
        <div className="landing-features">
          <div className="landing-feature">
            <ReferralIcon size={22} />
            <h3>Referral program</h3>
            <p>Share your referral code and earn a commission when the people you invite make an approved deposit - with a bonus tier once you reach 5 qualifying referrals.</p>
          </div>
          <div className="landing-feature">
            <ShieldIcon size={22} />
            <h3>Manually verified deposits</h3>
            <p>Every deposit is checked by an admin before it's approved - nothing is auto-approved from a submitted reference number alone.</p>
          </div>
          <div className="landing-feature">
            <WithdrawIcon size={22} />
            <h3>Transparent ledger</h3>
            <p>Every deposit, reward, commission, and withdrawal is recorded and visible in your transaction history - nothing is hidden.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
