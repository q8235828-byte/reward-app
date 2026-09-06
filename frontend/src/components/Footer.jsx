import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-columns">
        <div className="site-footer-column">
          <span className="app-title">Rewards</span>
          <p>A deposit, daily-reward, and referral platform.</p>
        </div>
        <div className="site-footer-column">
          <h4>Company</h4>
          <Link to="/about">About</Link>
          <Link to="/company-info">Company information</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="site-footer-column">
          <h4>Legal</h4>
          <Link to="/terms">Terms of service</Link>
          <Link to="/privacy">Privacy policy</Link>
        </div>
        <div className="site-footer-column">
          <h4>Support</h4>
          <Link to="/faq">FAQ</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} Rewards. All amounts and rates are configurable and are not a guaranteed return.</span>
      </div>
    </footer>
  );
}
