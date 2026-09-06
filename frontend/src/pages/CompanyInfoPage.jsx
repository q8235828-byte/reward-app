import PublicPageLayout from '../components/PublicPageLayout';

// EDIT THIS FILE with your real registered business details before going
// live - every value below is a placeholder. Nothing here is read from
// the database; it's plain static content on purpose, since company
// registration details don't change often and don't need an admin UI.
const COMPANY = {
  legalName: 'Your Company Name Pvt Ltd',
  registrationNumber: 'Company Registration / NTN: 0000000-0',
  businessType: 'Private Limited Company',
  registeredAddress: 'Your registered business address, City, Pakistan',
  contactEmail: 'contact@yourdomain.com',
  contactPhone: '+92 3XX XXXXXXX',
};

export default function CompanyInfoPage() {
  return (
    <PublicPageLayout>
      <h1>Company information</h1>
      <p className="info-lede">
        The following details identify the business operating this platform, as required for
        transparency with users and payment providers.
      </p>

      <div className="info-card">
        <dl className="detail-list info-detail-list">
          <div><dt>Legal company name</dt><dd>{COMPANY.legalName}</dd></div>
          <div><dt>Registration number</dt><dd>{COMPANY.registrationNumber}</dd></div>
          <div><dt>Business type</dt><dd>{COMPANY.businessType}</dd></div>
          <div><dt>Registered address</dt><dd>{COMPANY.registeredAddress}</dd></div>
          <div><dt>Contact email</dt><dd>{COMPANY.contactEmail}</dd></div>
          <div><dt>Contact phone</dt><dd>{COMPANY.contactPhone}</dd></div>
        </dl>
      </div>

      <p className="info-note">
        This platform facilitates deposits and withdrawals via JazzCash and Easypaisa. Before
        accepting real customer funds, confirm this business is registered and operating in
        compliance with applicable Pakistani law and the terms of those payment providers.
      </p>
    </PublicPageLayout>
  );
}
