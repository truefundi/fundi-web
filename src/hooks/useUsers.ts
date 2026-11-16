"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { customersApi, techniciansApi, usersApi } from "@/lib/api";
import { api } from "@/lib/api/client";
import { dashboardKeys } from "@/hooks/useDashboard";
import type { UserQuery } from "@/types/api";
import type { AccountStatus, Customer } from "@/types/customer";
import type { Technician } from "@/types/technician";
import { STAFF_ROLES, type StaffRole, type UserRole } from "@/types/user";

export const userKeys = {
  all: ["users"] as const,
  list: (query: UserQuery) => ["users", "list", query] as const,
  auditLogs: ["audit-logs"] as const,
};

const SUPER_ADMIN_EMAIL = "superadmin@fundi.rw";
const SUPER_ADMIN_ID = "5becebe8-00ea-4ada-9443-cf3426b0f19f";

function resolveSystemUserRole(raw: {
  id?: string;
  email?: string | null;
  role?: string;
  staffRole?: UserRole;
}): UserRole {
  if (
    raw.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL ||
    raw.id === SUPER_ADMIN_ID
  ) {
    return "SUPER_ADMIN";
  }

  return (raw.staffRole ?? raw.role ?? "CUSTOMER") as UserRole;
}

export function useUsers(query: UserQuery) {
  const isStaffSubRole =
    query.role && STAFF_ROLES.includes(query.role as StaffRole);

  // Backend only accepts CUSTOMER | TECHNICIAN | ADMIN in query params
  const backendQuery: UserQuery = {
    ...query,
    role: isStaffSubRole ? ("ADMIN" as UserRole) : query.role,
  };

  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: async () => {
      const response = await usersApi.list(backendQuery);

      // Normalize items to ensure Super Admin is recognized correctly
      const normalizedItems = response.items.map((user) => {
        const effectiveRole = resolveSystemUserRole(user);
        return {
          ...user,
          role: effectiveRole,
          staffRole: effectiveRole,
        };
      });

      if (isStaffSubRole && query.role !== "ADMIN") {
        const filteredItems = normalizedItems.filter(
          (user) => user.role === query.role,
        );
        return {
          ...response,
          items: filteredItems,
          total: filteredItems.length,
        };
      }

      return {
        ...response,
        items: normalizedItems,
      };
    },
    placeholderData: keepPreviousData,
  });
}

export type CreateUserInput = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
};

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserInput) => {
      const isStaff = STAFF_ROLES.includes(payload.role as StaffRole);

      const { data } = await api.post("/users", {
        ...payload,
        // Ensure backend enum validation passes while preserving specific staffRole
        role: isStaff ? "ADMIN" : payload.role,
        ...(isStaff ? { staffRole: payload.role } : {}),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.peopleGrowth });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const logAction = useLogAdminAction(); // 1. Call the logger hook

  return useMutation({
    mutationFn: async ({ id, role, status }: { id: string; role: UserRole; status: AccountStatus }) => {
      if (role === "CUSTOMER") return customersApi.updateStatus(id, status);
      if (role === "TECHNICIAN") return techniciansApi.updateStatus(id, status);
      throw new Error("Admin account status cannot be changed.");
    },
    onSuccess: (updatedUser, variables) => {
      // 2. Automatically record the action with the current time
      logAction.mutate({
        actorId: "current-admin-id",        // From your logged-in user session
        actorName: "Current Admin Name",    // From your logged-in user session
        actorRole: "ADMIN",                 // From your logged-in user session
        action: "CHANGED_USER_STATUS",
        target: `${variables.role} #${variables.id}`,
        details: `Set status to ${variables.status}`,
      });

      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export type AuditLogPayload = {
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  details: string;
};

export function useLogAdminAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: AuditLogPayload) => {
      const { data } = await api.post("/audit-logs", {
        ...entry,
        timestamp: new Date().toISOString(),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.auditLogs });
    },
  });
}