'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StoreSettings } from '@/types';
import { DEFAULT_STORE_SETTINGS, subscribeStoreSettings } from '@/lib/services/settingsService';

interface StoreSettingsContextType {
  settings: StoreSettings;
  loading: boolean;
}

const SETTINGS_CACHE_KEY = 'jeha_store_settings_cache';

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: DEFAULT_STORE_SETTINGS,
  loading: true,
});

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
        if (cached) {
          return { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(cached) };
        }
      } catch (e) {
        console.warn('Gagal membaca cache store settings:', e);
      }
    }
    return DEFAULT_STORE_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeStoreSettings((latest) => {
      setSettings(latest);
      setLoading(false);
      try {
        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(latest));
      } catch (e) {
        // Abaikan jika quota localStorage penuh
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <StoreSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
