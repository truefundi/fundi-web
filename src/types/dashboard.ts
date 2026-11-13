export type DashboardPeriod =
  | "today"
  | "last7days"
  | "currentMonth"
  | "month"
  | "currentYear"
  | "year"
  | "custom";

export type DashboardInterval = "hour" | "day" | "week" | "month";

export interface DashboardQuery extends Record<
  string,
  string | number | boolean | undefined | null
> {
  period?: DashboardPeriod;
  timezone?: string;
  month?: string;
  year?: number;
  from?: string;
  to?: string;
  compare?: boolean;
  serviceCategoryId?: string;
  customerId?: string;
  technicianId?: string;
  requestType?: string;
  jobStatus?: string;
  userRole?: string;
  userStatus?: string;
  technicianVerificationStatus?: string;
  technicianAvailability?: string;
  paymentStatus?: string;
  chatMessageType?: string;
}

export interface DashboardRange {
  period: DashboardPeriod;
  from: string;
  to: string;
  toExclusive: boolean;
  timezone: string;
}

export interface DashboardCount {
  count: number;
  [dimension: string]: string | boolean | number;
}

export interface DashboardOverview {
  range: DashboardRange;
  generatedAt: string;
  filters: Record<string, string | null>;
  comparison?: {
    period: DashboardRange;
    metrics: Record<
      string,
      {
        current: number | null;
        previous: number | null;
        change: number | null;
        changePercent: number | null;
      }
    >;
  };
  users: {
    newAccounts: number;
    byRoleAndStatus: DashboardCount[];
    phonesVerifiedInPeriod: number;
    currentlyPhoneVerified: number;
    passkeysRegisteredInPeriod: number;
    accountsWithPasskeys: number;
  };
  technicians: {
    newProfiles: number;
    currentByVerificationStatus: DashboardCount[];
    currentByAvailability: DashboardCount[];
  };
  jobs: {
    created: number;
    completedInPeriod: number;
    createdByStatusAndRequestType: Array<{
      status: string;
      requestType: string;
      count: number;
    }>;
  };
  payments: {
    count: number;
    bookingAmount: number;
    byStatusAndRequestType: Array<{
      status: string;
      requestType: string;
      count: number;
      amount: number;
    }>;
  };
  disputes: {
    opened: number;
    currentlyUnresolved: number;
  };
  chat: {
    messages: number;
    roomsCreated: number;
  };
  ratings: {
    count: number;
    responseCount: number;
    averageScore: number | null;
  };
  broadcasts: {
    sent: number;
    recipients: number;
    smsSent: number;
    smsFailed: number;
    inAppSent: number;
  };
  notificationsCreated: number;
  conversations: DashboardCount[];
  technicianDocuments: DashboardCount[];
  cancellationRequests: Array<{
    status: string;
    requester: string;
    count: number;
  }>;
  jobOffers: DashboardCount[];
  advertisements: {
    lifetimeCount: number;
    lifetimeImpressions: number;
    lifetimeClicks: number;
    clickThroughRate: number | null;
    note: string;
  };
  catalog: {
    newCategories: DashboardCount[];
    newServices: DashboardCount[];
    currentCategories: DashboardCount[];
    currentServices: DashboardCount[];
  };
  auditEvents: number;
}

export interface DashboardTrendPoint {
  bucket: string;
  value: number | null;
}

export interface DashboardTrendSeries {
  domain: string;
  metric: string;
  data: DashboardTrendPoint[];
}

export interface DashboardTrends {
  range: DashboardRange;
  interval: DashboardInterval;
  series: DashboardTrendSeries[];
}

export interface DashboardCategory {
  id: string;
  name: string | null;
  description?: string | null;
}

export interface DashboardBreakdowns {
  range: DashboardRange;
  catalog: {
    categoriesByStatus: Array<{ isActive: boolean; count: number }>;
    servicesByCategoryAndStatus: Array<{
      category: DashboardCategory;
      isActive: boolean;
      count: number;
    }>;
  };
  jobs: {
    statusRequestTypePriority: Array<{
      status: string;
      requestType: string;
      priority: string;
      count: number;
    }>;
    serviceCategories: Array<{
      serviceCategory:
        | (DashboardCategory & {
            category: { id: string; name: string };
          })
        | null;
      count: number;
    }>;
  };
  payments: Array<{
    status: string;
    requestType: string;
    count: number;
    amount: number;
  }>;
  ratingsByItem: Array<{
    item: string;
    averageScore: number | null;
    responseCount: number;
  }>;
  technicians: {
    verificationStatus: DashboardCount[];
    availabilityStatus: DashboardCount[];
  };
  [section: string]: unknown;
}

export interface DashboardTopTechnician {
  rank: number;
  technicianId: string;
  fullName: string;
  verificationStatus: string;
  availabilityStatus: string;
  completedJobs: number;
  ratingCount: number;
  averageRating: number | null;
}

export interface DashboardTopTechnicians {
  range: DashboardRange;
  data: DashboardTopTechnician[];
}

export interface DashboardActivity {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  actor: { id: string; fullName: string; role: string } | null;
  metadata: unknown;
  createdAt: string;
}

export interface DashboardActivityPage {
  range: DashboardRange;
  data: DashboardActivity[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}
