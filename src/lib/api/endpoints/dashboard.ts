import { env } from '@/config/env';
import { delay } from '@/mocks/mock-db';
import type { JobSummary } from '@/types/api';
import { api, unwrap } from '../client';

export const dashboardApi = {
  /**
   * Active, completed and disputed job counts. There is no jobs data yet, so the mock
   * returns `null` for each and the dashboard shows placeholders. When the backend
   * exposes GET /admin/jobs/summary, set NEXT_PUBLIC_USE_MOCKS=false and the real
   * numbers appear with no UI change.
   */
  async jobSummary(): Promise<JobSummary> {
    if (!env.useMocks) return unwrap(api.get('/admin/jobs/summary'));
    await delay();
    return { active: null, completed: null, openDisputes: null };
  },
};
