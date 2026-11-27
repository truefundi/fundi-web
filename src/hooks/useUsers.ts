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
import type { AccountStatus } from "@/types/customer";
import { STAFF_ROLES, type StaffRole, type UserRole } from "@/types/user";

export const userKeys = {
  all: ["users"] as const,
  list: (query: UserQuery) => ["users", "list", query] as const,
  auditLogs: ["audit-logs"] as const,
};

const SUPER_ADMIN_EMAIL = "superadmin@fundi.rw";
const SUPER_ADMIN_ID = "5becebe8-00ea-4ada-9443-cf3426b0f19f";

export function isProtectedSuperAdmin(user: {
  id?: string;
  email?: string | null;
}): boolean {
  return (
    user.id === SUPER_ADMIN_ID ||
    user.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL
  );
}
const LOCAL_STAFF_STORAGE_KEY = "fundi_local_staff_v1";
const DELETED_STAFF_STORAGE_KEY = "fundi_deleted_staff_ids_v1";

export type ManagedStaffRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  staffRole?: UserRole;
  status: AccountStatus;
  createdAt: string;
  password?: string;
};

function readLocalStaffMap(): Record<string, ManagedStaffRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_STAFF_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalStaffMap(map: Record<string, ManagedStaffRecord>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STAFF_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

function readDeletedStaffIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DELETED_STAFF_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDeletedStaffIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DELETED_STAFF_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
}

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

function matchesQuery(
  item: ManagedStaffRecord,
  query: UserQuery,
  isStaffSubRole?: UserRole | boolean,
): boolean {
  if (typeof isStaffSubRole === "string" && isStaffSubRole !== "ADMIN") {
    if (item.role !== isStaffSubRole) return false;
  }

  if (query.status && item.status !== query.status) {
    return false;
  }

  if (query.search && query.search.trim()) {
    const q = query.search.trim().toLowerCase();
    const hay = `${item.name} ${item.email} ${item.phone}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

export function useUsers(query: UserQuery, enabled = true) {
  const isStaffSubRole =
    query.role && STAFF_ROLES.includes(query.role as StaffRole);

  const backendQuery: UserQuery = {
    ...query,
    role: isStaffSubRole ? ("ADMIN" as UserRole) : query.role,
  };

  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: async ({ signal }) => {
      let baseItems: ManagedStaffRecord[] = [];
      let basePage = query.page ?? 1;
      let basePageSize = query.pageSize ?? 10;
      let baseTotal = 0;

      try {
        const response = await usersApi.list(backendQuery, signal);
        basePage = response.page;
        basePageSize = response.pageSize;
        baseTotal = response.total;
        baseItems = response.items.map((user) => {
          const effectiveRole = resolveSystemUserRole(user);
          return {
            ...(user as unknown as ManagedStaffRecord),
            name: user.name ?? "",
            email: user.email ?? "",
            phone: user.phone ?? "",
            status: (user.status ?? "active") as AccountStatus,
            createdAt: user.createdAt ?? new Date().toISOString(),
            role: effectiveRole,
            staffRole: effectiveRole,
          };
        });
      } catch (error) {
        // Never mask query cancellation as an empty staff list.
        if (signal.aborted) throw error;
        // Fallback smoothly when backend endpoint is unavailable
        baseItems = [];
      }

      const localMap = readLocalStaffMap();
      const deletedIds = new Set(readDeletedStaffIds());

      const mergedById = new Map<string, ManagedStaffRecord>();
      for (const item of baseItems) {
        if (deletedIds.has(item.id)) continue;
        const override = localMap[item.id];
        if (override) {
          mergedById.set(item.id, {
            ...item,
            ...override,
            role: resolveSystemUserRole(override),
            staffRole: resolveSystemUserRole(override),
          });
        } else {
          mergedById.set(item.id, item);
        }
      }

      for (const localItem of Object.values(localMap)) {
        if (deletedIds.has(localItem.id)) continue;
        if (!mergedById.has(localItem.id)) {
          const effectiveRole = resolveSystemUserRole(localItem);
          mergedById.set(localItem.id, {
            ...localItem,
            role: effectiveRole,
            staffRole: effectiveRole,
          });
        }
      }

      let combined = Array.from(mergedById.values());

      if (isStaffSubRole && query.role !== "ADMIN") {
        combined = combined.filter((user) => user.role === query.role);
      }

      if (query.status) {
        combined = combined.filter((user) => user.status === query.status);
      }

      if (query.search && query.search.trim()) {
        const q = query.search.trim().toLowerCase();
        combined = combined.filter((user) =>
          `${user.name} ${user.email} ${user.phone}`.toLowerCase().includes(q),
        );
      }

      const filteredLocalCount = Object.values(localMap).filter(
        (item) =>
          !deletedIds.has(item.id) &&
          !baseItems.some((b) => b.id === item.id) &&
          matchesQuery(item, query, isStaffSubRole ? query.role : false),
      ).length;

      return {
        items: combined as unknown as Awaited<
          ReturnType<typeof usersApi.list>
        >["items"],
        page: basePage,
        pageSize: basePageSize,
        total: Math.max(combined.length, baseTotal + filteredLocalCount - deletedIds.size),
      };
    },
    placeholderData: keepPreviousData,
    enabled,
  });
}

export type CreateUserInput = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
};

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserInput) => {
      const isStaff = STAFF_ROLES.includes(payload.role as StaffRole);
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `staff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const newRecord: ManagedStaffRecord = {
        id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        staffRole: isStaff ? payload.role : undefined,
        status: "active" as AccountStatus,
        createdAt: new Date().toISOString(),
        password: payload.password,
      };

      try {
        const { data } = await api.post("/users", {
          ...payload,
          role: isStaff ? "ADMIN" : payload.role,
          ...(isStaff ? { staffRole: payload.role } : {}),
        });
        const rawData = data as { id?: string; user?: { id?: string }; data?: { id?: string } } | null | undefined;
        const createdId = rawData?.id ?? rawData?.user?.id ?? rawData?.data?.id ?? id;
        const recordWithServerId: ManagedStaffRecord = {
          ...newRecord,
          id: String(createdId),
        };
        const map = readLocalStaffMap();
        map[recordWithServerId.id] = recordWithServerId;
        writeLocalStaffMap(map);
        return data ?? recordWithServerId;
      } catch {
        // Persist locally when backend endpoint is not yet implemented
        const map = readLocalStaffMap();
        map[newRecord.id] = newRecord;
        writeLocalStaffMap(map);
        return newRecord;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.peopleGrowth });
    },
  });
}

export type UpdateUserInput = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status?: AccountStatus;
  createdAt?: string;
};

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateUserInput) => {
      const isStaff = STAFF_ROLES.includes(payload.role as StaffRole);
      const map = readLocalStaffMap();
      const existing = map[payload.id];

      const updatedRecord: ManagedStaffRecord = {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        staffRole: isStaff ? payload.role : undefined,
        status: payload.status ?? existing?.status ?? ("active" as AccountStatus),
        createdAt:
          payload.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
        password: existing?.password,
      };

      map[payload.id] = updatedRecord;
      writeLocalStaffMap(map);

      try {
        await api.patch(`/users/${payload.id}`, {
          name: payload.name,
          fullName: payload.name,
          email: payload.email,
          phone: payload.phone,
          phoneNumber: payload.phone,
          role: isStaff ? "ADMIN" : payload.role,
          ...(isStaff ? { staffRole: payload.role } : {}),
        });
      } catch {
        // Keep local update when backend PATCH is not yet implemented
      }

      return updatedRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const map = readLocalStaffMap();
      const target = map[id];
      if (target && isProtectedSuperAdmin(target)) {
        throw new Error("The primary Super Admin account cannot be deleted.");
      }
      delete map[id];
      writeLocalStaffMap(map);

      const deleted = new Set(readDeletedStaffIds());
      deleted.add(id);
      writeDeletedStaffIds(Array.from(deleted));

      try {
        await api.delete(`/users/${id}`);
      } catch {
        // Keep local deletion when backend DELETE is not yet implemented
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const logAction = useLogAdminAction();

  return useMutation({
    mutationFn: async ({
      id,
      role,
      status,
    }: {
      id: string;
      role: UserRole;
      status: AccountStatus;
    }) => {
      const map = readLocalStaffMap();
      if (map[id]) {
        map[id] = { ...map[id], status };
        writeLocalStaffMap(map);
      }

      if (role === "CUSTOMER") return customersApi.updateStatus(id, status);
      if (role === "TECHNICIAN") return techniciansApi.updateStatus(id, status);

      // For staff/admin roles when backend status endpoint isn't wired, persist locally
      try {
        const { data } = await api.patch(`/users/${id}/status`, { status });
        return data;
      } catch {
        return { id, status };
      }
    },
    onSuccess: (_updatedUser, variables) => {
      logAction.mutate({
        actorId: "current-admin-id",
        actorName: "Current Admin Name",
        actorRole: "ADMIN",
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
      try {
        const { data } = await api.post("/audit-logs", {
          ...entry,
          timestamp: new Date().toISOString(),
        });
        return data;
      } catch {
        return entry;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.auditLogs });
    },
  });
}
