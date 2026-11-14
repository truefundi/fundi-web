"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/config/env";
import { dashboardApi } from "@/lib/api";
import type { DashboardQuery } from "@/types/dashboard";

export const dashboardKeys = {
  peopleGrowth: ["dashboard", "people-growth"] as const,
  analytics: (query: DashboardQuery) =>
    ["dashboard", "analytics", query] as const,
  jobSummary: ["dashboard", "job-summary"] as const,
};

export function useDashboardAnalytics(
  query: DashboardQuery,
  enabled = true,
  section:
    "overview" | "jobs" | "payments" | "quality" | "operations" = "overview",
) {
  const queryKey = dashboardKeys.analytics(query);
  return {
    overview: useQuery({
      queryKey: [...queryKey, "overview"],
      queryFn: () => dashboardApi.overview(query),
      refetchInterval: 60_000,
      enabled,
    }),
    trends: useQuery({
      queryKey: [...queryKey, "trends"],
      queryFn: () => dashboardApi.trends(query),
      refetchInterval: 60_000,
      enabled,
    }),
    breakdowns: useQuery({
      queryKey: [...queryKey, "breakdowns"],
      queryFn: () => dashboardApi.breakdowns(query),
      refetchInterval: 60_000,
      enabled,
    }),
    topTechnicians: useQuery({
      queryKey: [...queryKey, "top-technicians"],
      queryFn: () => dashboardApi.topTechnicians(query),
      refetchInterval: 60_000,
      enabled: enabled && section === "quality",
    }),
    activity: useQuery({
      queryKey: [...queryKey, "activity"],
      queryFn: () => dashboardApi.activity({ ...query, limit: 8 }),
      refetchInterval: 30_000,
      enabled: enabled && section === "operations",
    }),
  };
}

export function useDashboardActivityStream(query: DashboardQuery) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (env.useMocks) return;

    setConnected(false);
    const url = `${env.apiUrl.replace(/\/$/, "")}/admin/dashboard/events`;
    const stream = new EventSource(url, { withCredentials: true });
    const invalidateActivity = () => {
      setConnected(true);
      void queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.analytics(query), "activity"],
      });
      void queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.analytics(query), "overview"],
      });
    };
    const markDisconnected = () => setConnected(false);

    stream.onopen = () => setConnected(true);
    stream.onerror = markDisconnected;
    stream.addEventListener("dashboard.activity", invalidateActivity);
    return () => {
      stream.removeEventListener("dashboard.activity", invalidateActivity);
      stream.close();
    };
  }, [query, queryClient]);

  return connected;
}

export function useJobSummary() {
  return useQuery({
    queryKey: dashboardKeys.jobSummary,
    queryFn: () =>
      dashboardApi.overview({
        period: "currentMonth",
        timezone: "Africa/Kigali",
      }),
    select: (overview) => ({
      active: overview.jobs.createdByStatusAndRequestType
        .filter(
          (job) => !["COMPLETED", "CANCELLED", "FAILED"].includes(job.status),
        )
        .reduce((total, job) => total + job.count, 0),
      completed: overview.jobs.completedInPeriod,
      openDisputes: overview.disputes.currentlyUnresolved,
    }),
  });
}
