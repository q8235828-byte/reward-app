import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useBranding } from '../context/BrandingContext';

export default function PublicHeader() {
  const { siteName } = useBranding();
  return (
    <header className="landing-header">
      <Link to="/" className="app-title"><Logo />{siteName}</Link>
      <div className="landing-header-actions">
        <Link to="/login" className="link-button">Sign in</Link>
        <Link to="/register" className="landing-cta-small">Get started</Link>
      </div>
    </header>
  );
}
