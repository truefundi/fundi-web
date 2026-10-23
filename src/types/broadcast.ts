import type { UserRole } from './user';

export type BroadcastRole = Extract<UserRole, 'CUSTOMER' | 'TECHNICIAN'>;
export type BroadcastChannel = 'SMS' | 'IN_APP';

export interface BroadcastAudience {
  roles: BroadcastRole[];
  status: 'active';
}

export interface BroadcastInput {
  title: string;
  message: string;
  audience: BroadcastAudience;
  channels: BroadcastChannel[];
}

export interface BroadcastPreview {
  userCount: number;
  smsRecipientCount: number;
  inAppRecipientCount: number;
}

export interface BroadcastRecord extends BroadcastInput, BroadcastPreview {
  id: string;
  createdAt: string;
  mode: 'simulated' | 'queued';
}
