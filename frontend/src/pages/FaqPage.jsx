import PublicPageLayout from '../components/PublicPageLayout';

const FAQS = [
  {
    q: 'What is the minimum and maximum deposit?',
    a: 'Deposits range from Rs. 250 to Rs. 25,000 across 5 plans, each with its own range and reward rate - see the Plans section on the homepage for current ranges and rates.',
  },
  {
    q: 'Which payment methods are supported?',
    a: 'JazzCash and Easypaisa. After creating a deposit request, you\'ll see payment instructions - send the amount, then submit the transaction reference number from your payment app.',
  },
  {
    q: 'How is my deposit approved?',
    a: 'An admin reviews and manually verifies every deposit before approving it. Submitting a transaction reference does not automatically approve the deposit or activate your plan.',
  },
  {
    q: 'When can I withdraw?',
    a: 'Withdrawals open once your account meets a minimum age requirement (14 days by default). Your withdrawal page shows exactly how many days remain if you\'re not yet eligible.',
  },
  {
    q: 'How does the referral program work?',
    a: 'Share your referral code or link. When someone you referred makes their first approved deposit, you earn a commission on it, and your referral becomes "qualifying." Reach 5 qualifying referrals to unlock a bonus commission rate.',
  },
  {
    q: 'Are rewards or returns guaranteed?',
    a: 'No. Reward and commission rates are set by the platform and can change. This is not a guaranteed-return investment product.',
  },
  {
    q: 'Can I cancel or change my referrer after registering?',
    a: 'No - the referrer set (or not set) at registration is permanent and can\'t be changed afterward.',
  },
  {
    q: 'What happens if my withdrawal is rejected?',
    a: 'The amount you requested is returned to your withdrawable balance immediately - nothing is lost.',
  },
];

export default function FaqPage() {
  return (
    <PublicPageLayout>
      <h1>Frequently asked questions</h1>
      <div className="faq-list">
        {FAQS.map((item) => (
          <details className="faq-item" key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </PublicPageLayout>
  );
}
