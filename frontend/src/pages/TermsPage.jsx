import PublicPageLayout from '../components/PublicPageLayout';

export default function TermsPage() {
  return (
    <PublicPageLayout>
      <h1>Terms of service</h1>

      <p className="info-legal-notice">
        This is a starting template, not finished legal text. Since this platform handles real
        deposits and withdrawals, have these terms reviewed by a lawyer qualified in Pakistani
        law before relying on them.
      </p>

      <h2>1. Acceptance of terms</h2>
      <p>By registering an account, you agree to these terms and to any updates made to them.</p>

      <h2>2. Eligibility</h2>
      <p>You must provide accurate registration details and be legally able to enter a binding agreement to use this platform.</p>

      <h2>3. Deposits</h2>
      <p>Deposits are made via JazzCash or Easypaisa and are subject to manual verification. A submitted transaction reference does not guarantee approval.</p>

      <h2>4. Rewards and referral commissions</h2>
      <p>Reward and referral commission rates are set by the platform, are not guaranteed, and may change at any time.</p>

      <h2>5. Withdrawals</h2>
      <p>Withdrawals are subject to a minimum account age and minimum/maximum amount, both configurable by the platform.</p>

      <h2>6. Prohibited conduct</h2>
      <p>Fraudulent deposit claims, fake referral activity, and any attempt to manipulate the reward or referral system are prohibited and may result in account suspension.</p>

      <h2>7. Limitation of liability</h2>
      <p>The platform is provided as-is. To the extent permitted by law, the operator is not liable for indirect or consequential losses arising from use of the platform.</p>

      <h2>8. Changes to these terms</h2>
      <p>These terms may be updated from time to time; continued use of the platform after a change constitutes acceptance.</p>

      <h2>9. Contact</h2>
      <p>Questions about these terms can be directed to the contact details on our Contact page.</p>
    </PublicPageLayout>
  );
}
