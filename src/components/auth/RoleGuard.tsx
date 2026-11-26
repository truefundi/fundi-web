"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { hasPermission, type Permission, type UserRole } from "@/types/user";

export function RoleGuard({
  requiredPermission,
  children,
}: {
  requiredPermission: Permission;
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const effectiveRole = ((user as { staffRole?: UserRole } | null)?.staffRole ?? user?.role) as UserRole | undefined;
  const isAllowed = hasPermission(effectiveRole, requiredPermission);

  useEffect(() => {
    if (!isLoading && user && !isAllowed) {
      router.replace("/admin");
    }
  }, [isLoading, user, isAllowed, router]);

  if (isLoading || !user || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}