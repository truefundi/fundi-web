import { mapBackendCustomer, type BackendUser } from '@/lib/api/adapters/customers';
import type { PaginatedResponse, UserQuery } from '@/types/api';
import type { Customer } from '@/types/customer';
import type { UserRole } from '@/types/user';
import { api, unwrap } from '../client';

export type UserItem = Customer & { role: UserRole };

export const usersApi = {
  async list(query: UserQuery = {}): Promise<PaginatedResponse<UserItem>> {
    const { role, page = 1, pageSize = 10, ...filters } = query;

    const response = await unwrap(
      api.get<{
        data: BackendUser[];
        pagination: { page: number; limit: number; total: number };
      }>('/users', {
        query: {
          role,
          search: filters.search,
          status: filters.status?.toUpperCase(),
          page,
          limit: pageSize,
        },
      }),
    );

    return {
      items: response.data.map((user) => ({
        ...mapBackendCustomer(user),
        role: user.role as UserRole,
      })),
      total: response.pagination.total,
      page: response.pagination.page,
      pageSize: response.pagination.limit,
    };
  },
};