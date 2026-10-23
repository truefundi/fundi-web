import { env } from '@/config/env';
import { delay, mockDb } from '@/mocks/mock-db';
import type { BroadcastInput, BroadcastPreview, BroadcastRecord } from '@/types/broadcast';
import type { Account } from '@/types/customer';

function getAudienceAccounts(input: BroadcastInput['audience']) {
  const accounts: Account[] = [];
  if (input.roles.includes('CUSTOMER')) accounts.push(...mockDb.customers);
  if (input.roles.includes('TECHNICIAN')) accounts.push(...mockDb.technicians);
  return accounts.filter((account) => account.status === 'active');
}

function previewFor(input: BroadcastInput['audience']): BroadcastPreview {
  const accounts = getAudienceAccounts(input);
  return {
    userCount: accounts.length,
    smsRecipientCount: accounts.filter((account) => account.phone.trim().length > 0).length,
    inAppRecipientCount: accounts.length,
  };
}

export const broadcastsApi = {
  async preview(audience: BroadcastInput['audience']): Promise<BroadcastPreview> {
    if (!env.useMocks) throw new Error('Broadcast previews are only available in mock mode until a delivery backend is connected.');
    await delay();
    return previewFor(audience);
  },

  async list(): Promise<BroadcastRecord[]> {
    if (!env.useMocks) throw new Error('Broadcast history is only available in mock mode until a delivery backend is connected.');
    await delay();
    return [...mockDb.broadcasts].reverse();
  },

  async send(input: BroadcastInput): Promise<BroadcastRecord> {
    if (!env.useMocks) throw new Error('Broadcast delivery is not configured. Enable mock mode to simulate a broadcast.');
    await delay();
    const preview = previewFor(input.audience);
    const record: BroadcastRecord = {
      ...input,
      id: `broadcast-${Date.now()}`,
      ...preview,
      createdAt: new Date().toISOString(),
      mode: 'simulated',
    };
    mockDb.broadcasts.push(record);
    return record;
  },
};
