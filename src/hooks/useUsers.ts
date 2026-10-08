"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { customersApi, techniciansApi, usersApi } from "@/lib/api";
import type { UserQuery } from "@/types/api";
import type { AccountStatus } from "@/types/customer";
import type { UserRole } from "@/types/user";

export const userKeys = {
  all: ["users"] as const,
  list: (query: UserQuery) => ["users", "list", query] as const,
};

export function useUsers(query: UserQuery) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => usersApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      role,
      status,
    }: {
      id: string;
      role: UserRole;
      status: AccountStatus;
    }) => {
      if (role === "CUSTOMER") return customersApi.updateStatus(id, status);
      if (role === "TECHNICIAN") return techniciansApi.updateStatus(id, status);
      throw new Error(
        "Admin account status cannot be changed through the available API.",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
    },
  });
}
