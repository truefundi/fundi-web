"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/config/env";
import { dashboardApi } from "@/lib/api";
import type { DashboardQuery } from "@/types/dashboard";

export const dashboardKeys = {
  peopleGrowth: ["dashboard", "people-growth"] as const,
  analytics: (query: DashboardQuery) =>
    ["dashboard", "analytics", query] as const,
  jobSummary: ["dashboard", "job-summary"] as const,
  jobPipeline: ["dashboard", "job-pipeline"] as const,
};

const ANALYTICS_STALE_TIME = 15_000;

/** The filters the dashboard uses before an admin changes anything. */
export const DASHBOARD_INITIAL_QUERY: DashboardQuery = {
  period: "currentMonth",
  timezone: "Africa/Kigali",
  compare: false,
};

/**
 * Warm the default dashboard queries before the auth gate opens. Without this,
 * /auth/admin/me and the analytics requests are serialized, so the visible load
 * time is roughly two API round trips.
 */
export function useDashboardPrefetch(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const query = DASHBOARD_INITIAL_QUERY;
    const queryKey = dashboardKeys.analytics(query);
    void Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: [...queryKey, "overview"],
        queryFn: ({ signal }) => dashboardApi.overview(query, signal),
        staleTime: ANALYTICS_STALE_TIME,
      }),
      queryClient.prefetchQuery({
        queryKey: [...queryKey, "trends"],
        queryFn: ({ signal }) => dashboardApi.trends(query, signal),
        staleTime: ANALYTICS_STALE_TIME,
      }),
      queryClient.prefetchQuery({
        queryKey: [...queryKey, "breakdowns"],
        queryFn: ({ signal }) => dashboardApi.breakdowns(query, signal),
        staleTime: ANALYTICS_STALE_TIME,
      }),
    ]);
  }, [enabled, queryClient]);
}

/** Warm a section's extra queries when the admin shows intent to open it. */
export function useDashboardSectionPrefetch(query: DashboardQuery) {
  const queryClient = useQueryClient();

  return useCallback(
    (
      section: "overview" | "jobs" | "payments" | "quality" | "operations",
    ) => {
      const queryKey = dashboardKeys.analytics(query);

      if (section === "quality") {
        void queryClient.prefetchQuery({
          queryKey: [...queryKey, "top-technicians"],
          queryFn: ({ signal }) => dashboardApi.topTechnicians(query, signal),
          staleTime: ANALYTICS_STALE_TIME,
        });
      } else if (section === "operations") {
        void queryClient.prefetchQuery({
          queryKey: [...queryKey, "activity"],
          queryFn: ({ signal }) =>
            dashboardApi.activity({ ...query, limit: 8 }, signal),
          staleTime: 30_000,
        });
      }
    },
    [query, queryClient],
  );
}

export function useDashboardAnalytics(
  query: DashboardQuery,
  enabled = true,
  section:
    | "overview"
    | "jobs"
    | "payments"
    | "quality"
    | "operations" = "overview",
) {
  const queryKey = dashboardKeys.analytics(query);
  return {
    overview: useQuery({
      queryKey: [...queryKey, "overview"],
      queryFn: ({ signal }) => dashboardApi.overview(query, signal),
      staleTime: ANALYTICS_STALE_TIME,
      refetchInterval: 60_000,
      enabled,
    }),
    trends: useQuery({
      queryKey: [...queryKey, "trends"],
      queryFn: ({ signal }) => dashboardApi.trends(query, signal),
      staleTime: ANALYTICS_STALE_TIME,
      refetchInterval: 60_000,
      enabled,
    }),
    breakdowns: useQuery({
      queryKey: [...queryKey, "breakdowns"],
      queryFn: ({ signal }) => dashboardApi.breakdowns(query, signal),
      staleTime: ANALYTICS_STALE_TIME,
      refetchInterval: 60_000,
      enabled,
    }),
    topTechnicians: useQuery({
      queryKey: [...queryKey, "top-technicians"],
      queryFn: ({ signal }) => dashboardApi.topTechnicians(query, signal),
      staleTime: ANALYTICS_STALE_TIME,
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
