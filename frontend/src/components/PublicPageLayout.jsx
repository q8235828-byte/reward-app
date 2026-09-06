import PublicHeader from './PublicHeader';
import Footer from './Footer';

export default function PublicPageLayout({ children }) {
  return (
    <div className="landing-page">
      <PublicHeader />
      <main className="info-page">{children}</main>
      <Footer />
    </div>
  );
}
