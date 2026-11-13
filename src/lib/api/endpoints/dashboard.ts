import { env } from "@/config/env";
import { delay, mockDb } from "@/mocks/mock-db";
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
    if (!env.useMocks) {
      return unwrap(api.get("/admin/dashboard/overview", { query }));
    }
    await delay();
    const activeUsers = mockDb.customers.length + mockDb.technicians.length;
    const countByStatus = (status: string) =>
      mockDb.jobs.filter((job) => job.status === status).length;
    return {
      range: {
        period: query.period ?? "currentMonth",
        from: new Date().toISOString(),
        to: new Date().toISOString(),
        toExclusive: true,
        timezone: query.timezone ?? "UTC",
      },
      generatedAt: new Date().toISOString(),
      filters: {},
      users: {
        newAccounts: activeUsers,
        byRoleAndStatus: [],
        phonesVerifiedInPeriod: 0,
        currentlyPhoneVerified: 0,
        passkeysRegisteredInPeriod: 0,
        accountsWithPasskeys: 0,
      },
      technicians: {
        newProfiles: mockDb.technicians.length,
        currentByVerificationStatus: [],
        currentByAvailability: [],
      },
      jobs: {
        created: mockDb.jobs.length,
        completedInPeriod: countByStatus("COMPLETED"),
        createdByStatusAndRequestType: [],
      },
      payments: { count: 0, bookingAmount: 0, byStatusAndRequestType: [] },
      disputes: {
        opened: mockDb.jobs.filter((job) => job.dispute).length,
        currentlyUnresolved: mockDb.jobs.filter(
          (job) => job.dispute && !job.dispute.resolution,
        ).length,
      },
      chat: { messages: 0, roomsCreated: mockDb.chats.length },
      ratings: { count: 0, responseCount: 0, averageScore: null },
      broadcasts: {
        sent: 0,
        recipients: 0,
        smsSent: 0,
        smsFailed: 0,
        inAppSent: 0,
      },
      notificationsCreated: 0,
      conversations: [],
      technicianDocuments: [],
      cancellationRequests: [],
      jobOffers: [],
      advertisements: {
        lifetimeCount: 0,
        lifetimeImpressions: 0,
        lifetimeClicks: 0,
        clickThroughRate: null,
        note: "Mock data does not include ad analytics.",
      },
      catalog: {
        newCategories: [],
        newServices: [],
        currentCategories: [],
        currentServices: [],
      },
      auditEvents: 0,
    };
  },

  trends(query: DashboardQuery): Promise<DashboardTrends> {
    if (env.useMocks) {
      return Promise.resolve({
        range: this.privateRange(query),
        interval: "day",
        series: [
          "users.new",
          "jobs.created",
          "jobs.completed",
          "payments.count",
          "payments.bookingAmount",
          "disputes.opened",
          "chat.messages",
          "ratings.submitted",
          "ratings.averageScore",
          "catalog.categoriesCreated",
          "catalog.servicesCreated",
        ].map((key) => {
          const [domain, metric] = key.split(".");
          return { domain, metric, data: [] };
        }),
      });
    }
    return unwrap(api.get("/admin/dashboard/trends", { query }));
  },

  breakdowns(query: DashboardQuery): Promise<DashboardBreakdowns> {
    if (env.useMocks) {
      return Promise.resolve({
        range: this.privateRange(query),
        catalog: { categoriesByStatus: [], servicesByCategoryAndStatus: [] },
        jobs: { statusRequestTypePriority: [], serviceCategories: [] },
        payments: [],
        ratingsByItem: [],
        technicians: { verificationStatus: [], availabilityStatus: [] },
      });
    }
    return unwrap(api.get("/admin/dashboard/breakdowns", { query }));
  },

  topTechnicians(query: DashboardQuery): Promise<DashboardTopTechnicians> {
    if (env.useMocks) {
      return Promise.resolve({
        range: this.privateRange(query),
        data: mockDb.technicians.slice(0, 10).map((technician, index) => ({
          rank: index + 1,
          technicianId: technician.id,
          fullName: technician.name,
          verificationStatus: technician.verification.status.toUpperCase(),
          availabilityStatus: technician.isAvailable ? "ONLINE" : "OFFLINE",
          completedJobs: 0,
          ratingCount: 0,
          averageRating: null,
        })),
      });
    }
    return unwrap(api.get("/admin/dashboard/top-technicians", { query }));
  },

  activity(
    query: DashboardQuery & { limit?: number },
  ): Promise<DashboardActivityPage> {
    if (env.useMocks) {
      return Promise.resolve({
        range: this.privateRange(query),
        data: [],
        pagination: {
          limit: query.limit ?? 8,
          offset: 0,
          total: 0,
          hasMore: false,
        },
      });
    }
    return unwrap(api.get("/admin/dashboard/activity", { query }));
  },
};
