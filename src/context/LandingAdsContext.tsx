'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { adsApi } from '@/lib/api/endpoints/ads';
import type { LandingAd, LandingAdInput } from '@/types/landing-ad';

interface LandingAdsContextValue {
  ads: LandingAd[];
  nextProductId: number;
  isLoaded: boolean;
  storageError: string | null;
  saveAd: (input: LandingAdInput, id?: string) => Promise<LandingAd>;
  deleteAd: (id: string) => Promise<void>;
  /** Internal: lets the provider fetch only while a component needs ads. */
  subscribe: () => () => void;
}

const LandingAdsContext = createContext<LandingAdsContextValue | null>(null);

export function LandingAdsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const [ads, setAds] = useState<LandingAd[]>([]);
  const [nextProductId, setNextProductId] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [consumers, setConsumers] = useState(0);
  const consumersRef = useRef(0);

  const subscribe = useCallback(() => {
    consumersRef.current += 1;
    setConsumers(consumersRef.current);
    return () => {
      consumersRef.current = Math.max(0, consumersRef.current - 1);
      setConsumers(consumersRef.current);
    };
  }, []);

  useEffect(() => {
    if (consumers === 0) {
      setAds([]);
      setIsLoaded(false);
      setStorageError(null);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setIsLoaded(false);
    adsApi
      .list(isAdmin, controller.signal)
      .then((items) => {
        if (!active) return;
        setAds(items);
        setNextProductId(Math.max(0, ...items.map((ad) => ad.productId)) + 1);
        setStorageError(null);
      })
      .catch((cause: unknown) => {
        if (active && !controller.signal.aborted) {
          setStorageError(
            cause instanceof Error ? cause.message : 'Could not load ads.',
          );
        }
      })
      .finally(() => {
        if (active) setIsLoaded(true);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [consumers, isAdmin]);

  const saveAd = useCallback(
    async (input: LandingAdInput, id?: string) => {
      const existing = ads.find((ad) => ad.id === id);
      const productId = existing?.productId ?? nextProductId;
      const saved = await adsApi.save(input, productId, id);
      setAds((current) =>
        existing ? current.map((ad) => (ad.id === id ? saved : ad)) : [...current, saved],
      );
      if (!existing) setNextProductId(productId + 1);
      setStorageError(null);
      return saved;
    },
    [ads, nextProductId],
  );

  const deleteAd = useCallback(async (id: string) => {
    await adsApi.remove(id);
    setAds((current) => current.filter((ad) => ad.id !== id));
    setStorageError(null);
  }, []);

  const value = useMemo(
    () => ({ ads, nextProductId, isLoaded, storageError, saveAd, deleteAd, subscribe }),
    [ads, nextProductId, isLoaded, storageError, saveAd, deleteAd, subscribe],
  );

  return <LandingAdsContext.Provider value={value}>{children}</LandingAdsContext.Provider>;
}

export function useLandingAds(): Omit<LandingAdsContextValue, 'subscribe'> {
  const context = useContext(LandingAdsContext);
  if (!context) throw new Error('useLandingAds must be used inside LandingAdsProvider');

  const { subscribe } = context;
  useEffect(() => subscribe(), [subscribe]);

  return context;
}
