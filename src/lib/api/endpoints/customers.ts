import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import { mapBackendCustomer, type BackendUser } from '@/lib/api/adapters/customers';
import type { AdminStats, CustomerQuery, PaginatedResponse } from '@/types/api';
import type { AccountStatus, Customer } from '@/types/customer';
import { api, unwrap } from '../client';
import { queryAccounts } from '../mock-utils';

function findMock(id: string): Customer {
  const customer = mockDb.customers.find((c) => c.id === id);
  if (!customer) throw new MockNotFoundError('Customer', id);
  return customer;
}

const STATUS_TO_API: Record<AccountStatus, 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'> = {
  active: 'ACTIVE',
  suspended: 'SUSPENDED',
  inactive: 'INACTIVE',
};

export const customersApi = {
  async list(query: CustomerQuery = {}): Promise<PaginatedResponse<Customer>> {
    if (!env.useMocks) {
      const response = await unwrap(
        api.get<{ data: BackendUser[]; pagination: { page: number; limit: number; total: number } }>('/users', {
          query: {
            role: 'CUSTOMER',
            search: query.search,
            status: query.status ? STATUS_TO_API[query.status] : undefined,
            page: query.page,
            limit: query.pageSize,
          },
        }),
      );
      return {
        items: (response.data || []).map(mapBackendCustomer),
        total: response.pagination?.total ?? 0,
        page: response.pagination?.page ?? 1,
        pageSize: response.pagination?.limit ?? (query.pageSize || 20),
      };
    }
    await delay();
    return clone(queryAccounts(mockDb.customers, query));
  },

  async get(id: string): Promise<Customer> {
    if (!env.useMocks) {
      const data = await unwrap(api.get<BackendUser>(`/users/${id}`));
      return mapBackendCustomer(data);
    }
    await delay();
    return clone(findMock(id));
  },

  async updateStatus(id: string, status: AccountStatus): Promise<Customer> {
    if (!env.useMocks) {
      const apiStatus = STATUS_TO_API[status] ?? (status.toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE');
      const data = await unwrap(api.patch<BackendUser>(`/users/${id}/status`, { status: apiStatus }));
      return mapBackendCustomer(data);
    }
    await delay();
    const customer = findMock(id);
    customer.status = status;
    return clone(customer);
  },

  async stats(): Promise<AdminStats> {
    if (!env.useMocks) return unwrap(api.get('/admin/stats'));
    await delay();
    const accounts = [...mockDb.customers, ...mockDb.technicians];
    return {
      totalUsers: accounts.length,
      totalCustomers: mockDb.customers.length,
      totalTechnicians: mockDb.technicians.length,
      pendingVerifications: mockDb.technicians.filter((t) => t.verification.status === 'pending').length,
      suspendedAccounts: accounts.filter((a) => a.status === 'suspended').length,
    };
  },
};
