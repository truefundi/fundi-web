import { env } from '@/config/env';
import { api, unwrap } from '../client';
import type { LandingAd, LandingAdInput } from '@/types/landing-ad';

type BackendAd = Omit<LandingAd, 'image'> & { imageUrl: string | null; isLive: boolean };
function mapAd(ad: BackendAd): LandingAd {
  let image = ad.imageUrl || '/images/technician.jpg';
  if (image.startsWith('/api/v1/') && env.apiUrl !== '/api/v1') {
    image = `${env.apiUrl.replace(/\/$/, '')}${image.slice('/api/v1'.length)}`;
  }
  return { ...ad, image, imageAlt: ad.imageAlt || ad.title, productId: ad.productId ?? 0 };
}

export const adsApi = {
  async list(admin: boolean): Promise<LandingAd[]> {
    if (admin) {
      const response = await unwrap(api.get<{ items: BackendAd[] }>('/admin/ads', { query: { placement: 'LANDING_PRODUCT', limit: 200 } }));
      return response.items.map(mapAd);
    }
    const response = await unwrap(api.get<BackendAd[]>('/ads', { query: { placement: 'LANDING_PRODUCT' } }));
    return response.map(mapAd);
  },
  async save(input: LandingAdInput, productId: number, id?: string): Promise<LandingAd> {
    const payload = {
      productId, title: input.title, description: input.description,
      imageAlt: input.imageAlt, callToAction: input.callToAction,
      badge: input.status === 'Live' ? 'LIVE' : 'COMING_SOON',
      placement: 'LANDING_PRODUCT', isActive: input.isActive,
      ...( /^https?:\/\//.test(input.image) ? { imageUrl: input.image } : {}),
    };
    let saved = await unwrap(id
      ? api.patch<BackendAd>(`/admin/ads/${id}`, payload)
      : api.post<BackendAd>('/admin/ads', payload));
    if (input.image.startsWith('data:') || input.image.startsWith('/images/')) {
      const blob = await (await fetch(input.image)).blob();
      const form = new FormData();
      form.append('file', blob, `creative.${blob.type.split('/')[1] || 'png'}`);
      saved = await unwrap(api.put<BackendAd>(`/admin/ads/${saved.id}/image`, form));
    }
    return mapAd(saved);
  },
  async remove(id: string): Promise<void> { await unwrap(api.delete(`/admin/ads/${id}`)); },
};
