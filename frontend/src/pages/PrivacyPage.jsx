import PublicPageLayout from '../components/PublicPageLayout';

export default function PrivacyPage() {
  return (
    <PublicPageLayout>
      <h1>Privacy policy</h1>

      <p className="info-legal-notice">
        This is a starting template, not finished legal text. Have it reviewed by a lawyer
        qualified in Pakistani data protection law before relying on it.
      </p>

      <h2>Information we collect</h2>
      <p>Your full name, mobile number, and (if provided) a referral code at registration; deposit and withdrawal details you submit, including payment method and account information you provide for withdrawals.</p>

      <h2>How we use your information</h2>
      <p>To operate your account, process deposits and withdrawals, calculate rewards and referral commissions, and communicate with you about your account (such as password reset links sent by SMS).</p>

      <h2>Data storage and security</h2>
      <p>Passwords are hashed and never stored in plain text. Access to administrative functions is restricted to authorized personnel, and all administrative actions are logged.</p>

      <h2>Third parties</h2>
      <p>We do not sell your data. Payment verification may involve JazzCash or Easypaisa as the payment methods you choose to use.</p>

      <h2>Your rights</h2>
      <p>You can request a copy of your account information or ask us to correct inaccurate details by contacting us.</p>

      <h2>Changes to this policy</h2>
      <p>This policy may be updated from time to time; continued use of the platform after a change constitutes acceptance.</p>

      <h2>Contact</h2>
      <p>Privacy questions can be directed to the contact details on our Contact page.</p>
    </PublicPageLayout>
  );
}
