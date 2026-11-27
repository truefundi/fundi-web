export type AccountStatus = 'active' | 'suspended' | 'inactive';

export const ACCOUNT_STATUSES: AccountStatus[] = ['active', 'suspended', 'inactive'];

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  inactive: 'Inactive',
};

/** Fields shared by every Fundi account. */
export interface Account {
  id: string;
  name: string;
  /** E.164 format, e.g. +250788123456 */
  phone: string;
  email?: string;
  status: AccountStatus;
  location: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface Customer extends Account {
  jobsRequested: number;
}
