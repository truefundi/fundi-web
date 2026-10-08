import { env } from "@/config/env";
import { clone, delay, mockDb } from "@/mocks/mock-db";
import type { PaginatedResponse, UserQuery } from "@/types/api";
import type { UserRecord } from "@/types/user";
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
      return { items: [], total: 0, page, pageSize };
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
      env.useMocks
        ? usersApi.list({
            ...filters,
            role: "ADMIN",
            page: 1,
            pageSize: requestedCount,
          })
        : Promise.resolve({
            items: [],
            total: 0,
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
