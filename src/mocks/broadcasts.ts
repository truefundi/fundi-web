
import type { BroadcastChannel, BroadcastRole } from '@/types/broadcast';

export interface MockBroadcast {
  id: string;
  title: string;
  message: string;
  audience: {
    roles: BroadcastRole[];
    status: 'active';
  };
  channels: BroadcastChannel[];
  createdAt: string;
  userCount: number;
  smsRecipientCount: number;
  inAppRecipientCount: number;
}

export const MOCK_BROADCASTS: MockBroadcast[] = [
  {
    id: 'broadcast-001',
    title: 'Welcome to Fundi',
    message:
      'Welcome to Fundi! Find trusted technicians and get help with your service requests.',
    audience: { roles: ['CUSTOMER'], status: 'active' },
    channels: ['SMS', 'IN_APP'],
    createdAt: '2026-10-26T08:30:00.000Z',
    userCount: 120,
    smsRecipientCount: 105,
    inAppRecipientCount: 120,
  },
  {
    id: 'broadcast-002',
    title: 'Technician Profile Reminder',
    message:
      'Please review your Fundi profile and keep your skills and contact details up to date.',
    audience: { roles: ['TECHNICIAN'], status: 'active' },
    channels: ['IN_APP'],
    createdAt: '2026-10-25T10:15:00.000Z',
    userCount: 48,
    smsRecipientCount: 0,
    inAppRecipientCount: 48,
  },
  {
    id: 'broadcast-003',
    title: 'Scheduled Service Update',
    message:
      'We are improving the Fundi experience. Thank you for being part of our community.',
    audience: {
      roles: ['CUSTOMER', 'TECHNICIAN'],
      status: 'active',
    },
    channels: ['SMS', 'IN_APP'],
    createdAt: '2026-10-24T14:00:00.000Z',
    userCount: 168,
    smsRecipientCount: 145,
    inAppRecipientCount: 168,
  },
  {
    id: 'broadcast-004',
    title: 'Service Request Reminder',
    message:
      'Remember to check your service requests and keep track of updates from your technician.',
    audience: { roles: ['CUSTOMER'], status: 'active' },
    channels: ['IN_APP'],
    createdAt: '2026-10-22T07:45:00.000Z',
    userCount: 120,
    smsRecipientCount: 0,
    inAppRecipientCount: 120,
  },
  {
    id: 'broadcast-005',
    title: 'New Job Opportunities',
    message:
      'Check Fundi regularly for new service opportunities and keep your availability up to date.',
    audience: { roles: ['TECHNICIAN'], status: 'active' },
    channels: ['SMS', 'IN_APP'],
    createdAt: '2026-10-20T12:00:00.000Z',
    userCount: 48,
    smsRecipientCount: 42,
    inAppRecipientCount: 48,
  },
  {
    id: 'broadcast-006',
    title: 'Customer Support Update',
    message:
      'Need assistance? Contact Fundi support for help with your service requests.',
    audience: {
      roles: ['CUSTOMER', 'TECHNICIAN'],
      status: 'active',
    },
    channels: ['IN_APP'],
    createdAt: '2026-10-18T09:20:00.000Z',
    userCount: 168,
    smsRecipientCount: 0,
    inAppRecipientCount: 168,
  },
];
