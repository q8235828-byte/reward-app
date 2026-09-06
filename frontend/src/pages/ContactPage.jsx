import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';

// EDIT THIS FILE with your real support contact details before going live.
const CONTACT = {
  email: 'support@yourdomain.com',
  phone: '+92 3XX XXXXXXX',
  hours: 'Monday - Saturday, 10:00 - 18:00 (PKT)',
};

export default function ContactPage() {
  return (
    <PublicPageLayout>
      <h1>Contact us</h1>
      <p className="info-lede">
        Have a question about a deposit, withdrawal, or your account? Reach out and our team will
        get back to you.
      </p>

      <div className="info-card">
        <dl className="detail-list info-detail-list">
          <div><dt>Email</dt><dd>{CONTACT.email}</dd></div>
          <div><dt>Phone</dt><dd>{CONTACT.phone}</dd></div>
          <div><dt>Support hours</dt><dd>{CONTACT.hours}</dd></div>
        </dl>
      </div>

      <p>
        For our registered business details, see <Link to="/company-info">Company information</Link>.
        For common questions, check the <Link to="/faq">FAQ</Link> first.
      </p>
    </PublicPageLayout>
  );
}
