'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'fundi.commission-rate-percent';
export const DEFAULT_COMMISSION_RATE_PERCENT = 30;

interface CommissionSettings {
  commissionRatePercent: number;
  isLoaded: boolean;
  storageError: string | null;
  setCommissionRatePercent: (rate: number) => void;
}

const CommissionSettingsContext = createContext<CommissionSettings | null>(null);

function isValidRate(rate: number): boolean {
  return Number.isFinite(rate) && rate >= 0 && rate <= 100;
}

export function CommissionSettingsProvider({ children }: { children: React.ReactNode }) {
  const [commissionRatePercent, setCommissionRatePercentState] = useState(DEFAULT_COMMISSION_RATE_PERCENT);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = Number(stored);
        if (!isValidRate(parsed)) {
          setStorageError('The saved commission rate is invalid. Enter and save a valid rate to replace it.');
        } else {
          setCommissionRatePercentState(parsed);
        }
      }
    } catch {
      setStorageError('Commission settings could not be read from this browser.');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === null) {
        setCommissionRatePercentState(DEFAULT_COMMISSION_RATE_PERCENT);
        setStorageError(null);
        return;
      }
      const parsed = Number(event.newValue);
      if (isValidRate(parsed)) {
        setCommissionRatePercentState(parsed);
        setStorageError(null);
      } else {
        setStorageError('The saved commission rate is invalid. Enter and save a valid rate to replace it.');
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setCommissionRatePercent = useCallback((rate: number) => {
    if (!isValidRate(rate)) throw new Error('Commission rate must be between 0 and 100%.');
    window.localStorage.setItem(STORAGE_KEY, String(rate));
    setCommissionRatePercentState(rate);
    setStorageError(null);
  }, []);

  const value = useMemo(
    () => ({ commissionRatePercent, isLoaded, storageError, setCommissionRatePercent }),
    [commissionRatePercent, isLoaded, storageError, setCommissionRatePercent],
  );

  return <CommissionSettingsContext.Provider value={value}>{children}</CommissionSettingsContext.Provider>;
}

export function useCommissionSettings(): CommissionSettings {
  const context = useContext(CommissionSettingsContext);
  if (!context) throw new Error('useCommissionSettings must be used inside CommissionSettingsProvider');
  return context;
}
