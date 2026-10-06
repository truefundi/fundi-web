import type { ServiceCategory } from '@/config/services';
import type { AccountStatus } from './customer';
import type { VerificationStatus } from './technician';
import type { JobGroup, JobStatus, Urgency } from './job';

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
  service?: ServiceCategory;
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

export interface AdminStats {
  totalCustomers: number;
  totalTechnicians: number;
  pendingVerifications: number;
  suspendedAccounts: number;
}

export type ServiceState ='up' | 'down' | 'degraded';

export interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    api: ServiceState;
    database: ServiceState;
    redis: ServiceState;
  };
}
