import { api } from '../client';
import type { HealthStatus } from '@/types/api';

export const healthApi = {
  check: () => api.get<HealthStatus>('/health', { cache: 'no-store' }),
};
