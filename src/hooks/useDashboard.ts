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
      queryFn: ({ signal }) => dashboardApi.overview(query, signal),
      staleTime: 15_000,
      refetchInterval: 60_000,
      enabled,
    }),
    trends: useQuery({
      queryKey: [...queryKey, "trends"],
      queryFn: ({ signal }) => dashboardApi.trends(query, signal),
      staleTime: 15_000,
      refetchInterval: 60_000,
      enabled,
    }),
    breakdowns: useQuery({
      queryKey: [...queryKey, "breakdowns"],
      queryFn: ({ signal }) => dashboardApi.breakdowns(query, signal),
      staleTime: 15_000,
      refetchInterval: 60_000,
      enabled,
    }),
    topTechnicians: useQuery({
      queryKey: [...queryKey, "top-technicians"],
      queryFn: ({ signal }) => dashboardApi.topTechnicians(query, signal),
      staleTime: 15_000,
      refetchInterval: 60_000,
      enabled: enabled && section === "quality",
    }),
    activity: useQuery({
      queryKey: [...queryKey, "activity"],
      queryFn: ({ signal }) => dashboardApi.activity({ ...query, limit: 8 }, signal),
      refetchInterval: 30_000,
      enabled: enabled && section === "operations",
    }),
  };
}

export function useDashboardActivityStream(query: DashboardQuery) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setConnected(false);
    const url = `${env.apiUrl.replace(/\/$/, "")}/admin/dashboard/events`;
    const stream = new EventSource(url, { withCredentials: true });
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const invalidateActivity = () => {
      setConnected(true);
      // One poll can deliver many audit rows. Refresh active charts once per
      // burst, rather than cancelling/restarting requests for every event.
      if (refreshTimer !== undefined) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        void queryClient.invalidateQueries({ queryKey: dashboardKeys.analytics(query) });
      }, 250);
    };
    const markDisconnected = () => setConnected(false);

    stream.onopen = () => setConnected(true);
    stream.onerror = markDisconnected;
    stream.addEventListener("dashboard.activity", invalidateActivity);
    return () => {
      clearTimeout(refreshTimer);
      stream.removeEventListener("dashboard.activity", invalidateActivity);
      stream.close();
    };
  }, [query, queryClient]);

  return connected;
}

export function useJobSummary() {
  return useQuery({
    queryKey: dashboardKeys.jobSummary,
    queryFn: ({ signal }) =>
      dashboardApi.overview(
        {
          period: "currentMonth",
          timezone: "Africa/Kigali",
        },
        signal,
      ),
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
