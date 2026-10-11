import type { ServiceCategory } from '@/config/services';
import type { AccountStatus } from './customer';
import type { VerificationStatus } from './technician';
import type { JobGroup, JobStatus, Urgency } from './job';
import type { UserRole } from './user';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  /** HTTP status, or 0 when the request never reached the server. */
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortOrder = 'newest' | 'oldest' | 'name';

export interface ListQuery {
  search?: string;
  status?: AccountStatus;
  page?: number;
  pageSize?: number;
  sort?: SortOrder;
}

export type CustomerQuery = ListQuery;

export interface TechnicianQuery extends ListQuery {
  trade?: ServiceCategory;
  verification?: VerificationStatus;
  available?: boolean;
}

export interface JobQuery {
  search?: string;
  group?: JobGroup;
  service?: string;
  urgency?: Urgency;
  page?: number;
  pageSize?: number;
}

/** Job counts per status and per list group, for tabs and the dashboard. */
export interface JobStats {
  total: number;
  byStatus: Partial<Record<JobStatus, number>>;
  byGroup: Record<JobGroup, number>;
}

export interface UserQuery extends ListQuery {
  role?: UserRole;
}

export interface AdminStats {
  /** Customers and technicians together. */
  totalUsers: number;
  totalCustomers: number;
  totalTechnicians: number;
  pendingVerifications: number;
  suspendedAccounts: number;
}

/**
 * Job counts for the dashboard. `null` means the jobs API cannot provide that
 * figure yet, so the dashboard shows a placeholder instead of a wrong number.
 */
export interface JobSummary {
  active: number | null;
  completed: number | null;
  openDisputes: number | null;
}

export type ServiceState = 'up' | 'down' | 'degraded';

export interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    api: ServiceState;
    database: ServiceState;
    redis: ServiceState;
  };
}
