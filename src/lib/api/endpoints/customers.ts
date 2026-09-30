import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import type { AdminStats, CustomerQuery, PaginatedResponse } from '@/types/api';
import type { AccountStatus, Customer } from '@/types/customer';
import { api, unwrap } from '../client';
import { queryAccounts } from '../mock-utils';

function findMock(id: string): Customer {
  const customer = mockDb.customers.find((c) => c.id === id);
  if (!customer) throw new MockNotFoundError('Customer', id);
  return customer;
}

export const customersApi = {
  async list(query: CustomerQuery = {}): Promise<PaginatedResponse<Customer>> {
    if (!env.useMocks) return unwrap(api.get('/admin/customers', { query: { ...query } }));
    await delay();
    return clone(queryAccounts(mockDb.customers, query));
  },

  async get(id: string): Promise<Customer> {
    if (!env.useMocks) return unwrap(api.get(`/admin/customers/${id}`));
    await delay();
    return clone(findMock(id));
  },

  async updateStatus(id: string, status: AccountStatus): Promise<Customer> {
    if (!env.useMocks) return unwrap(api.patch(`/admin/customers/${id}/status`, { status }));
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
      totalCustomers: mockDb.customers.length,
      totalTechnicians: mockDb.technicians.length,
      pendingVerifications: mockDb.technicians.filter((t) => t.verification.status === 'pending').length,
      suspendedAccounts: accounts.filter((a) => a.status === 'suspended').length,
    };
  },
};
