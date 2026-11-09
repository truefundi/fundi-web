import { env } from "@/config/env";
import { clone, delay, mockDb } from "@/mocks/mock-db";
import { mapBackendCustomer, type BackendUser } from "@/lib/api/adapters/customers";
import type { PaginatedResponse, UserQuery } from "@/types/api";
import type { UserRecord } from "@/types/user";
import { api, unwrap } from "../client";
import { queryAccounts } from "../mock-utils";
import { customersApi } from "./customers";
import { techniciansApi } from "./technicians";

export const usersApi = {
  async list(query: UserQuery = {}): Promise<PaginatedResponse<UserRecord>> {
    const { role, page = 1, pageSize = 10, ...filters } = query;

    if (role === "ADMIN") {
      if (env.useMocks) {
        await delay();
        return clone(
          queryAccounts(mockDb.admins, { ...filters, page, pageSize }),
        );
      }
      const response = await unwrap<{ data: BackendUser[]; pagination: { page: number; limit: number; total: number } }>(
        api.get('/users', {
          query: {
            role: 'ADMIN',
            search: filters.search,
            page,
            limit: pageSize,
          },
        }),
      );
      return {
        items: (response.data || []).map((u) => ({
          ...mapBackendCustomer(u),
          role: 'ADMIN' as const,
        })),
        total: response.pagination?.total ?? 0,
        page: response.pagination?.page ?? 1,
        pageSize: response.pagination?.limit ?? pageSize,
      };
    }

    if (role === "CUSTOMER") {
      const result = await customersApi.list({ ...filters, page, pageSize });
      return {
        ...result,
        items: result.items.map((user) => ({
          ...user,
          role: "CUSTOMER" as const,
        })),
      };
    }

    if (role === "TECHNICIAN") {
      const result = await techniciansApi.list({ ...filters, page, pageSize });
      return {
        ...result,
        items: result.items.map((user) => ({
          ...user,
          role: "TECHNICIAN" as const,
        })),
      };
    }

    const requestedCount = page * pageSize;
    const [customers, technicians, admins] = await Promise.all([
      customersApi.list({ ...filters, page: 1, pageSize: requestedCount }),
      techniciansApi.list({ ...filters, page: 1, pageSize: requestedCount }),
      usersApi.list({
        ...filters,
        role: "ADMIN",
        page: 1,
        pageSize: requestedCount,
      }),
    ]);
    const items: UserRecord[] = [
      ...customers.items.map((user) => ({
        ...user,
        role: "CUSTOMER" as const,
      })),
      ...technicians.items.map((user) => ({
        ...user,
        role: "TECHNICIAN" as const,
      })),
      ...admins.items,
    ];

    items.sort((a, b) => {
      if (filters.sort === "name") return a.name.localeCompare(b.name);
      const dateOrder = Date.parse(a.createdAt) - Date.parse(b.createdAt);
      return filters.sort === "oldest" ? dateOrder : -dateOrder;
    });

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total: customers.total + technicians.total + admins.total,
      page,
      pageSize,
    };
  },
};
