export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  /** HTTP status, or 0 when the request never reached the server. */
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ServiceState = 'up' | 'down' | 'degraded';

export interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    api: ServiceState;
    database: ServiceState;
    redis: ServiceState;
  };
}
