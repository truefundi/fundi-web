import type { JobPipeline } from "@/types/api";
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

  async overview(query: DashboardQuery): Promise<DashboardOverview> {
    return unwrap(api.get("/admin/dashboard/overview", { query }));
  },

  async jobPipeline(): Promise<JobPipeline> {
    return unwrap(api.get("/admin/jobs/pipeline"));
  },

  trends(query: DashboardQuery): Promise<DashboardTrends> {
    return unwrap(api.get("/admin/dashboard/trends", { query }));
  },

  breakdowns(query: DashboardQuery): Promise<DashboardBreakdowns> {
    return unwrap(api.get("/admin/dashboard/breakdowns", { query }));
  },

  topTechnicians(query: DashboardQuery): Promise<DashboardTopTechnicians> {
    return unwrap(api.get("/admin/dashboard/top-technicians", { query }));
  },

  activity(
    query: DashboardQuery & { limit?: number },
  ): Promise<DashboardActivityPage> {
    return unwrap(api.get("/admin/dashboard/activity", { query }));
  },
};