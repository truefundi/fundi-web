import { env } from '@/config/env';
import { delay, mockDb } from '@/mocks/mock-db';
import type { JobSummary } from '@/types/api';
import { api, unwrap } from '../client';

export const dashboardApi = {
  /**
   * Active, completed and disputed job counts, from GET /admin/jobs/summary when the
   * backend is connected. A field may be `null` if the backend cannot provide it yet;
   * the dashboard then shows a placeholder for it.
   */
  async jobSummary(): Promise<JobSummary> {
    if (!env.useMocks) return unwrap(api.get('/admin/jobs/summary'));
    await delay();
    const count = (test: (status: string) => boolean) => mockDb.jobs.filter((j) => test(j.status)).length;
    return {
      active: count((s) => s !== 'COMPLETED' && s !== 'CANCELLED' && s !== 'DISPUTED'),
      completed: count((s) => s === 'COMPLETED'),
      openDisputes: mockDb.jobs.filter((j) => j.dispute && !j.dispute.resolution).length,
    };
  },
};
