'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { products } from '@/components/landing/content';
import type { LandingAd, LandingAdInput } from '@/types/landing-ad';

const STORAGE_KEY = 'fundi.landing-ads';

const DEFAULT_ADS: LandingAd[] = products.map((product) => ({
  id: `product-${product.id}`,
  productId: product.id,
  title: product.name,
  description: product.description,
  image: product.image,
  imageAlt: product.imageAlt,
  status: product.status === 'Live' ? 'Live' : 'Coming soon',
  callToAction: 'Explore product',
  isActive: true,
}));

interface StoredAds {
  ads: LandingAd[];
  nextProductId: number;
}

interface LandingAdsContextValue {
  ads: LandingAd[];
  nextProductId: number;
  isLoaded: boolean;
  storageError: string | null;
  saveAd: (input: LandingAdInput, id?: string) => LandingAd;
  deleteAd: (id: string) => void;
}

const LandingAdsContext = createContext<LandingAdsContextValue | null>(null);

function isLandingAd(value: unknown): value is LandingAd {
  if (typeof value !== 'object' || value === null) return false;
  const ad = value as Record<string, unknown>;
  return (
    typeof ad.id === 'string' &&
    typeof ad.productId === 'number' &&
    typeof ad.title === 'string' &&
    typeof ad.description === 'string' &&
    typeof ad.image === 'string' &&
    typeof ad.imageAlt === 'string' &&
    (ad.status === 'Coming soon' || ad.status === 'Live') &&
    typeof ad.callToAction === 'string' &&
    typeof ad.isActive === 'boolean'
  );
}

function parseAds(value: string): StoredAds {
  const parsed: unknown = JSON.parse(value);
  if (Array.isArray(parsed)) {
    const ads = parsed.map((item) => {
      if (isLandingAd(item)) return item;
      if (
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        typeof item.id === 'string' &&
        'productId' in item &&
        typeof item.productId === 'number' &&
        'title' in item &&
        typeof item.title === 'string' &&
        'description' in item &&
        typeof item.description === 'string' &&
        'image' in item &&
        typeof item.image === 'string' &&
        'imageAlt' in item &&
        typeof item.imageAlt === 'string' &&
        'callToAction' in item &&
        typeof item.callToAction === 'string' &&
        'isActive' in item &&
        typeof item.isActive === 'boolean'
      ) {
        return { ...item, status: 'Coming soon' as const };
      }
      throw new Error('Saved landing ads have an invalid format.');
    });
    return {
      ads,
      nextProductId: Math.max(0, ...ads.map((ad) => ad.productId)) + 1,
    };
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('ads' in parsed) ||
    !Array.isArray(parsed.ads) ||
    !parsed.ads.every(isLandingAd) ||
    !('nextProductId' in parsed) ||
    typeof parsed.nextProductId !== 'number' ||
    !Number.isSafeInteger(parsed.nextProductId)
  ) {
    throw new Error('Saved landing ads have an invalid format.');
  }
  return parsed as StoredAds;
}

export function LandingAdsProvider({ children }: { children: React.ReactNode }) {
  const [ads, setAds] = useState(DEFAULT_ADS);
  const [nextProductId, setNextProductId] = useState(
    Math.max(...DEFAULT_ADS.map((ad) => ad.productId)) + 1,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const saved = parseAds(stored);
        setAds(saved.ads);
        setNextProductId(Math.max(saved.nextProductId, ...saved.ads.map((ad) => ad.productId + 1)));
      }
    } catch {
      setStorageError('Landing ads could not be read from this browser. Saving an update will replace the invalid saved data.');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === null) {
        setAds(DEFAULT_ADS);
        setNextProductId(Math.max(...DEFAULT_ADS.map((ad) => ad.productId)) + 1);
        setStorageError(null);
        return;
      }
      try {
        const saved = parseAds(event.newValue);
        setAds(saved.ads);
        setNextProductId(Math.max(saved.nextProductId, ...saved.ads.map((ad) => ad.productId + 1)));
        setStorageError(null);
      } catch {
        setStorageError('Landing ads saved in another tab have an invalid format.');
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const persist = useCallback((nextAds: LandingAd[], nextId: number) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ads: nextAds, nextProductId: nextId }));
    setAds(nextAds);
    setNextProductId(nextId);
    setStorageError(null);
  }, []);

  const saveAd = useCallback((input: LandingAdInput, id?: string) => {
    const existing = ads.find((ad) => ad.id === id);
    const productId = existing?.productId ?? nextProductId;
    const adId = existing?.id ?? `product-${productId}`;
    const savedAd: LandingAd = { ...input, id: adId, productId };
    const nextAds = existing
      ? ads.map((ad) => (ad.id === adId ? savedAd : ad))
      : [...ads, savedAd];
    persist(nextAds, existing ? nextProductId : nextProductId + 1);
    return savedAd;
  }, [ads, nextProductId, persist]);

  const deleteAd = useCallback((id: string) => {
    persist(ads.filter((ad) => ad.id !== id), nextProductId);
  }, [ads, nextProductId, persist]);

  const value = useMemo(
    () => ({ ads, nextProductId, isLoaded, storageError, saveAd, deleteAd }),
    [ads, nextProductId, isLoaded, storageError, saveAd, deleteAd],
  );

  return <LandingAdsContext.Provider value={value}>{children}</LandingAdsContext.Provider>;
}

export function useLandingAds(): LandingAdsContextValue {
  const context = useContext(LandingAdsContext);
  if (!context) throw new Error('useLandingAds must be used inside LandingAdsProvider');
  return context;
}
