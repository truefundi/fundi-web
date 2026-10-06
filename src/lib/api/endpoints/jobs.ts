import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import type { JobQuery, JobStats, PaginatedResponse } from '@/types/api';
import { JOB_GROUPS, JOB_STATUS_LABEL, jobGroup, type Job, type JobParty, type JobStatus } from '@/types/job';
import { api, unwrap } from '../client';
import { DEFAULT_PAGE_SIZE } from '../mock-utils';

function findMock(id: string): Job {
  const job = mockDb.jobs.find((j) => j.id === id);
  if (!job) throw new MockNotFoundError('Job', id);
  return job;
}

function matchesSearch(job: Job, search?: string): boolean {
  const term = search?.trim().toLowerCase();
  if (!term) return true;
  return [job.reference, job.problem, job.customer.name, job.technician?.name ?? '', job.location].some((value) =>
    value.toLowerCase().includes(term),
  );
}

/** Records a status change the way the backend would: new status, timestamp and timeline event. */
function transition(job: Job, status: JobStatus, text: string): Job {
  const at = new Date().toISOString();
  job.status = status;
  job.updatedAt = at;
  job.events.push({ id: `evt_${job.id}_${job.events.length + 1}`, status, title: JOB_STATUS_LABEL[status], text, at });
  return clone(job);
}

export const jobsApi = {
  async list(query: JobQuery = {}): Promise<PaginatedResponse<Job>> {
    if (!env.useMocks) return unwrap(api.get('/admin/jobs', { query: { ...query } }));
    await delay();
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = query;
    const items = mockDb.jobs
      .filter(
        (job) =>
          matchesSearch(job, query.search) &&
          (!query.group || jobGroup(job.status) === query.group) &&
          (!query.service || job.service === query.service) &&
          (!query.urgency || job.urgency === query.urgency),
      )
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const start = (page - 1) * pageSize;
    return clone({ items: items.slice(start, start + pageSize), total: items.length, page, pageSize });
  },

  async get(id: string): Promise<Job> {
    if (!env.useMocks) return unwrap(api.get(`/admin/jobs/${id}`));
    await delay();
    return clone(findMock(id));
  },

  async stats(): Promise<JobStats> {
    if (!env.useMocks) return unwrap(api.get('/admin/jobs/stats'));
    await delay();
    const byStatus: JobStats['byStatus'] = {};
    const byGroup = Object.fromEntries(JOB_GROUPS.map((g) => [g, 0])) as JobStats['byGroup'];
    for (const job of mockDb.jobs) {
      byStatus[job.status] = (byStatus[job.status] ?? 0) + 1;
      byGroup[jobGroup(job.status)] += 1;
    }
    return { total: mockDb.jobs.length, byStatus, byGroup };
  },

  async cancel(id: string, reason: string): Promise<Job> {
    if (!env.useMocks) return unwrap(api.post(`/admin/jobs/${id}/cancel`, { reason }));
    await delay();
    const job = findMock(id);
    job.cancellationReason = reason;
    return transition(job, 'CANCELLED', `Cancelled by Fundi admin: ${reason}`);
  },

  async reassign(id: string, technician: JobParty): Promise<Job> {
    if (!env.useMocks) return unwrap(api.post(`/admin/jobs/${id}/reassign`, { technicianId: technician.id }));
    await delay();
    const job = findMock(id);
    const previous = job.technician?.name;
    job.technician = technician;
    // A new technician has to accept the job again.
    return transition(
      job,
      'OFFERED',
      previous
        ? `Reassigned by Fundi admin from ${previous} to ${technician.name}.`
        : `Assigned by Fundi admin to ${technician.name}.`,
    );
  },
};
