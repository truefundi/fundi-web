"use client";

import { usePathname } from "next/navigation";
import { useDashboardPrefetch } from "@/hooks/useDashboard";

/**
 * Mounted outside RequireAuth so the default dashboard data starts loading in
 * parallel with the session check. Renders nothing and exposes no data.
 */
export function DashboardPrefetch() {
  const pathname = usePathname();
  useDashboardPrefetch(pathname === "/admin");
  return null;
}
