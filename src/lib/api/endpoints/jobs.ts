import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import type { JobQuery, JobStats, PaginatedResponse } from '@/types/api';
import { canDelete, canEdit } from '@/lib/jobs';
import {
  JOB_GROUPS,
  JOB_STATUS_LABEL,
  jobGroup,
  type Job,
  type JobEditInput,
  type JobInput,
  type JobParty,
  type JobStatus,
  type Rating,
  type Urgency,
} from '@/types/job';
import type { Service } from '@/types/service';
import { api, ApiError, unwrap } from '../client';
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
    return transition(
      job,
      'MATCHING',
      previous
        ? `Customer is negotiating with ${technician.name} instead of ${previous}.`
        : `Customer can now negotiate with ${technician.name}.`,
    );
  },

  /** Creates a request on behalf of a customer; the visit fee comes from the service settings. */
  async create(input: JobInput): Promise<Job> {
    if (!env.useMocks) return unwrap(api.post('/admin/jobs', input));
    await delay();
    const partyType = input.partyType ?? 'customer';
    const account =
      partyType === 'customer'
        ? mockDb.customers.find((c) => c.id === input.customerId)
        : mockDb.technicians.find((t) => t.id === input.customerId);
    if (!account) throw new MockNotFoundError(partyType === 'customer' ? 'Customer' : 'Technician', input.customerId);
    const service = findService(input.service);
    const now = new Date().toISOString();
    const number = Math.max(1040, ...mockDb.jobs.map((j) => Number(j.reference.slice(3)) || 0)) + 1;
    const job: Job = {
      id: `job_${Date.now()}`,
      reference: `FD-${number}`,
      service: service.name,
      problem: input.problem.trim(),
      urgency: input.urgency,
      location: input.location.trim(),
      customer: { id: account.id, name: account.name, phone: account.phone },
      status: 'REQUESTED',
      createdAt: now,
      updatedAt: now,
      visitFee: feeFor(service, input.urgency),
      events: [
        {
          id: `evt_${Date.now()}_1`,
          status: 'REQUESTED',
          title: JOB_STATUS_LABEL.REQUESTED,
          text: `Created by Fundi admin for ${account.name}: ${input.problem.trim()}`,
          at: now,
        },
      ],
    };
    mockDb.jobs.unshift(job);
    return clone(job);
  },

  /** Edits the details of a job that has not been paid for yet, and logs the change. */
  async update(id: string, input: JobEditInput): Promise<Job> {
    if (!env.useMocks) return unwrap(api.patch(`/admin/jobs/${id}`, input));
    await delay();
    const job = findMock(id);
    if (!canEdit(job)) throw new ApiError('This job can no longer be edited because the visit fee has been paid.', 409);
    const service = findService(input.service);
    Object.assign(job, {
      service: service.name,
      problem: input.problem.trim(),
      urgency: input.urgency,
      location: input.location.trim(),
      visitFee: feeFor(service, input.urgency),
      updatedAt: new Date().toISOString(),
    });
    job.events.push({
      id: `evt_${job.id}_${job.events.length + 1}`,
      status: job.status,
      title: 'Details edited',
      text: 'Fundi admin updated the service, problem, urgency or location.',
      at: job.updatedAt,
    });
    return clone(job);
  },

  /** Removes a mistaken or duplicate job; jobs with payments must be cancelled instead. */
  async rate(jobId: string, rating: Rating): Promise<Job> {
    if (!env.useMocks) return unwrap(api.post(`/admin/jobs/${jobId}/rating`, rating));
    await delay();
    const job = findMock(jobId);
    const overall = Number(
      ((rating.quality + rating.professionalism + rating.arrival + rating.communication + rating.value) / 5).toFixed(1),
    );
    const nextRating = {
      ...rating,
      comment: rating.comment.trim(),
      overall,
    };
    job.rating = nextRating;
    job.updatedAt = new Date().toISOString();
    job.events.push({
      id: `evt_${job.id}_${job.events.length + 1}`,
      status: job.status,
      title: 'Customer rating',
      text: `${job.customer.name} rated ${job.technician?.name ?? 'the technician'} ${overall}/5 and left a comment.`,
      at: job.updatedAt,
    });
    return clone(job);
  },

  async remove(id: string): Promise<void> {
    if (!env.useMocks) {
      await unwrap(api.delete(`/admin/jobs/${id}`));
      return;
    }
    await delay();
    const job = findMock(id);
    if (!canDelete(job)) {
      throw new ApiError('Jobs with payments cannot be deleted. Cancel the job instead to keep its record.', 409);
    }
    mockDb.jobs = mockDb.jobs.filter((j) => j.id !== id);
  },
};

function findService(name: string): Service {
  const service = mockDb.services.find((s) => s.name === name);
  if (!service) throw new ApiError(`The service "${name}" does not exist.`, 400);
  return service;
}

const feeFor = (service: Service, urgency: Urgency) =>
  urgency === 'Emergency' ? service.emergencyVisitFee : service.visitFee;
