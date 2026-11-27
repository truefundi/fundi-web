import type {
  DashboardActivityPage,
  DashboardBreakdowns,
  DashboardOverview,
  DashboardQuery,
  DashboardTopTechnicians,
  DashboardTrends,
} from "@/types/dashboard";
import { api, unwrap } from "../client";

export const dashboardApi = {
  privateRange(query: DashboardQuery) {
    const now = new Date();
    return {
      period: query.period ?? "currentMonth",
      from: now.toISOString(),
      to: now.toISOString(),
      toExclusive: true,
      timezone: query.timezone ?? "UTC",
    } as const;
  },

  async overview(
    query: DashboardQuery,
    signal?: AbortSignal,
  ): Promise<DashboardOverview> {
    return unwrap(api.get("/admin/dashboard/overview", { query, signal }));
  },

  trends(query: DashboardQuery, signal?: AbortSignal): Promise<DashboardTrends> {
    return unwrap(api.get("/admin/dashboard/trends", { query, signal }));
  },

  breakdowns(
    query: DashboardQuery,
    signal?: AbortSignal,
  ): Promise<DashboardBreakdowns> {
    return unwrap(api.get("/admin/dashboard/breakdowns", { query, signal }));
  },

  topTechnicians(
    query: DashboardQuery,
    signal?: AbortSignal,
  ): Promise<DashboardTopTechnicians> {
    return unwrap(api.get("/admin/dashboard/top-technicians", { query, signal }));
  },

  activity(
    query: DashboardQuery & { limit?: number },
    signal?: AbortSignal,
  ): Promise<DashboardActivityPage> {
    return unwrap(api.get("/admin/dashboard/activity", { query, signal }));
  },
};