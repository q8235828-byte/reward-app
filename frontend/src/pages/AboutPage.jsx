import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';

export default function AboutPage() {
  return (
    <PublicPageLayout>
      <h1>About Rewards</h1>
      <p className="info-lede">
        Rewards is a deposit, daily-reward, and referral platform. Users choose a plan, deposit
        through JazzCash or Easypaisa, and earn rewards on their deposit according to that plan's
        rate and schedule. A referral program lets members earn a commission when people they
        invite make an approved deposit.
      </p>

      <h2>How deposits are verified</h2>
      <p>
        Every deposit is reviewed and approved by hand before it's credited - a submitted
        transaction reference alone never automatically approves a deposit or activates a plan.
      </p>

      <h2>What we don't claim</h2>
      <p>
        Reward and commission rates are configurable and can change. Nothing on this platform is
        a guaranteed or risk-free return, and using it does not constitute financial advice.
      </p>

      <p>
        For our registered business details, see the <Link to="/company-info">Company information</Link> page.
        Questions? <Link to="/contact">Contact us</Link>.
      </p>
    </PublicPageLayout>
  );
}
