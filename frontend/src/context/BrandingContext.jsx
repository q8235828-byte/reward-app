import {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react';
import { api } from '../services/api';

const DEFAULT_BRANDING = { siteName: 'Rewards', logoUrl: '' };

const BrandingContext = createContext(null);

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  const refreshBranding = useCallback(() => {
    api.get('/settings')
      .then((res) => {
        const { siteName, logoUrl } = res.data.settings;
        setBranding({ siteName: siteName || 'Rewards', logoUrl: logoUrl || '' });
      })
      .catch(() => {});
  }, []);

  useEffect(() => { refreshBranding(); }, [refreshBranding]);

  useEffect(() => {
    document.title = branding.siteName;
  }, [branding.siteName]);

  return (
    <BrandingContext.Provider value={{ ...branding, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}
