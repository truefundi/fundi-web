import type { AccountStatus, Customer } from '@/types/customer';

export type BackendUser = {
  id: string;
  email?: string | null;
  phoneNumber: string;
  fullName: string;
  role: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string | Date;
  updatedAt: string | Date;
};

const STATUS_MAP: Record<BackendUser['status'], AccountStatus> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

export function mapBackendCustomer(user: BackendUser): Customer {
  return {
    id: user.id, name: user.fullName, phone: user.phoneNumber,
    email: user.email || undefined, status: STATUS_MAP[user.status],
    location: '—',
    createdAt: new Date(user.createdAt).toISOString(),
    lastActiveAt: new Date(user.updatedAt).toISOString(),
    jobsRequested: 0,
  };
}
