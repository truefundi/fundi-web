import { DEFAULT_PAGE_SIZE } from '@/config/pagination';
import { mapBackendCustomer, type BackendUser } from '@/lib/api/adapters/customers';
import type { AdminStats, CustomerQuery, PaginatedResponse } from '@/types/api';
import type { AccountStatus, Customer } from '@/types/customer';
import { api, unwrap } from '../client';

const STATUS_TO_API: Record<AccountStatus, 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'> = {
  active: 'ACTIVE',
  suspended: 'SUSPENDED',
  inactive: 'INACTIVE',
};

export const customersApi = {
  async list(
    query: CustomerQuery = {},
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<Customer>> {
    const response = await unwrap(
      api.get<{ data: BackendUser[]; pagination: { page: number; limit: number; total: number } }>('/users', {
        query: {
          role: 'CUSTOMER',
          search: query.search,
          status: query.status ? STATUS_TO_API[query.status] : undefined,
          page: query.page,
          limit: query.pageSize,
        },
        signal,
      }),
    );
    return {
      items: (response.data || []).map(mapBackendCustomer),
      total: response.pagination?.total ?? 0,
      page: response.pagination?.page ?? 1,
      pageSize: response.pagination?.limit ?? (query.pageSize || DEFAULT_PAGE_SIZE),
    };
  },

  async get(id: string, signal?: AbortSignal): Promise<Customer> {
    const data = await unwrap<BackendUser>(api.get(`/users/${id}`, { signal }));
    return mapBackendCustomer(data);
  },

  async updateStatus(id: string, status: AccountStatus): Promise<Customer> {
    const apiStatus = STATUS_TO_API[status] ?? (status.toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE');
    const data = await unwrap<BackendUser>(api.patch(`/users/${id}/status`, { status: apiStatus }));
    return mapBackendCustomer(data);
  },

  async stats(signal?: AbortSignal): Promise<AdminStats> {
    return unwrap(api.get('/admin/stats', { signal }));
  },
};