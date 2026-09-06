import { Link } from 'react-router-dom';

export default function PublicHeader() {
  return (
    <header className="landing-header">
      <Link to="/" className="app-title">Rewards</Link>
      <div className="landing-header-actions">
        <Link to="/login" className="link-button">Sign in</Link>
        <Link to="/register" className="landing-cta-small">Get started</Link>
      </div>
    </header>
  );
}
