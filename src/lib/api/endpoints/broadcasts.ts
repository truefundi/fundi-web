import { api, unwrap } from '../client';
import type { BroadcastInput, BroadcastPreview, BroadcastRecord } from '@/types/broadcast';

export const broadcastsApi = {
  async preview(audience: BroadcastInput['audience']): Promise<BroadcastPreview> {
    return unwrap(api.post('/admin/broadcasts/preview', audience));
  },

  async list(): Promise<BroadcastRecord[]> {
    const response = await unwrap<{ items: BroadcastRecord[] }>(
      api.get('/admin/broadcasts', { query: { limit: 100 } }),
    );
    return response.items;
  },

  async send(input: BroadcastInput): Promise<BroadcastRecord> {
    return unwrap(api.post('/admin/broadcasts', input));
  },
};