import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { SiteSettings } from '../types';
import {
  emptySiteSettings,
  setSiteSettingsFromDb,
} from '../utils/config';

export interface SiteSettingsContextValue {
  settings: SiteSettings;
  loading: boolean;
  reload: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: emptySiteSettings(),
  loading: true,
  reload: async () => {},
});

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<SiteSettings>(
    () => emptySiteSettings(),
  );
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json?.success && json.data) {
        setSiteSettingsFromDb(json.data);
        setSettings(json.data);
      }
    } catch {
      // mantiene bootstrap como valor mientras la BD no responda
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const value = useMemo(
    () => ({ settings, loading, reload: fetchSettings }),
    [settings, loading, fetchSettings],
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);