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

export function mapBackendCustomer(user: BackendUser | Partial<Customer> | any): Customer {
  if (!user) {
    return {
      id: '',
      name: '—',
      phone: '—',
      status: 'inactive',
      location: '—',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      jobsRequested: 0,
    };
  }

  // Already adapted
  if ('name' in user && 'jobsRequested' in user) {
    return user as Customer;
  }

  const statusKey = user.status as keyof typeof STATUS_MAP | undefined;

  return {
    id: user.id,
    name: user.fullName || user.name || '—',
    phone: user.phoneNumber || user.phone || '—',
    email: user.email || undefined,
    status: (statusKey ? STATUS_MAP[statusKey] : user.status) ?? 'inactive',
    location: user.location || 'Kigali',
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : user.createdAt?.toISOString?.() ?? new Date().toISOString(),
    lastActiveAt: typeof user.updatedAt === 'string' ? user.updatedAt : user.updatedAt?.toISOString?.() ?? user.lastActiveAt ?? new Date().toISOString(),
    jobsRequested: user.jobsRequested ?? 0,
  };
}
