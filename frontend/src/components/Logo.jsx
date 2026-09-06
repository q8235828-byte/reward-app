import { useBranding } from '../context/BrandingContext';

export default function Logo({ size = 26 }) {
  const { siteName, logoUrl } = useBranding();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={siteName}
        className="app-logo-img"
        style={{ width: size, height: size }}
      />
    );
  }

  return <span className="app-logo-mark" style={{ width: size, height: size }} />;
}
