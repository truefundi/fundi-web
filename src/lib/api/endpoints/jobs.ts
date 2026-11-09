
import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import type { JobQuery, JobStats, PaginatedResponse } from '@/types/api';
import { canDelete, canEdit } from '@/lib/jobs';
import { mapBackendJob } from '@/lib/api/adapters/jobs';
import {
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

type JobLocationAndPayment = {
  latitude: number;
  longitude: number;
  offeredAmount: number;
};

type BackendJobInput = JobInput & JobLocationAndPayment;

function findMock(id: string): Job {
  const job = mockDb.jobs.find((j) => j.id === id);
  if (!job) throw new MockNotFoundError('Job', id);
  return job;
}

function matchesSearch(job: Job, search?: string): boolean {
  const term = search?.trim().toLowerCase();
  if (!term) return true;

  return [
    job.reference,
    job.problem,
    job.customer.name,
    job.technician?.name ?? '',
    job.location,
    job.service,
  ].some((value) => value.toLowerCase().includes(term));
}

function transition(job: Job, status: JobStatus, text: string): Job {
  const at = new Date().toISOString();

  job.status = status;
  job.updatedAt = at;
  job.events.push({
    id: `evt_${job.id}_${job.events.length + 1}`,
    status,
    title: JOB_STATUS_LABEL[status],
    text,
    at,
  });

  return clone(job);
}

function validateJobLocationAndPayment(
  input: JobLocationAndPayment,
): void {
  if (
    !Number.isFinite(input.latitude) ||
    input.latitude < -90 ||
    input.latitude > 90
  ) {
    throw new ApiError('Please provide a valid latitude.', 400);
  }

  if (
    !Number.isFinite(input.longitude) ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    throw new ApiError('Please provide a valid longitude.', 400);
  }

  if (!Number.isFinite(input.offeredAmount) || input.offeredAmount <= 0) {
    throw new ApiError('Please enter a valid technician payment amount.', 400);
  }
}

async function getBackendCategoryId(serviceName: string): Promise<string> {
  const response = await unwrap<Service[]>(
    api.get('/catalog/categories'),
  );

  const selectedService = response.find(
    (service) =>
      service.name.trim().toLowerCase() === serviceName.trim().toLowerCase(),
  );

  if (!selectedService) {
    throw new ApiError(
      `Service category "${serviceName}" was not found.`,
      400,
    );
  }

  return selectedService.id;
}

function backendPriority(urgency: Urgency): 'NORMAL' | 'URGENT' {
  return urgency === 'Emergency' ? 'URGENT' : 'NORMAL';
}

export const jobsApi = {
  async list(query: JobQuery = {}): Promise<PaginatedResponse<Job>> {
    if (!env.useMocks) {
      const response = await unwrap(api.get('/admin/jobs'));
      const backendJobs = response as Parameters<typeof mapBackendJob>[0][];
      const jobs = backendJobs.map(mapBackendJob);

      const filteredJobs = jobs
        .filter((job) => {
          const search = query.search?.trim().toLowerCase();

          const matchesSearch =
            !search ||
            [
              job.reference,
              job.problem,
              job.customer.name,
              job.technician?.name ?? '',
              job.location,
              job.service,
            ].some((value) => value.toLowerCase().includes(search));

          return (
            matchesSearch &&
            (!query.group || jobGroup(job.status) === query.group) &&
            (!query.service || job.service === query.service) &&
            (!query.urgency || job.urgency === query.urgency)
          );
        })
        .sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
        );

      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
      const start = (page - 1) * pageSize;

      return {
        items: filteredJobs.slice(start, start + pageSize),
        total: filteredJobs.length,
        page,
        pageSize,
      };
    }

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
      .sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );

    const start = (page - 1) * pageSize;

    return clone({
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
    });
  },

  async get(id: string): Promise<Job> {
    if (!env.useMocks) {
      const response = await unwrap(api.get(`/admin/jobs/${id}`));
      return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
    }

    await delay();
    return clone(findMock(id));
  },

  async stats(): Promise<JobStats> {
    if (!env.useMocks) {
      return unwrap(api.get('/admin/jobs/summary'));
    }

    await delay();

    const activeStatuses = [
      'REQUESTED',
      'MATCHING',
      'OFFERED',
      'ACCEPTED',
      'VISIT_PAID',
      'EN_ROUTE',
      'REPAIR_IN_PROGRESS',
    ];

    const active = mockDb.jobs.filter((job) =>
      activeStatuses.includes(job.status),
    ).length;

    const completed = mockDb.jobs.filter(
      (job) => job.status === 'COMPLETED',
    ).length;

    return {
      active,
      completed,
      openDisputes: 0,
    };
  },

  async cancel(id: string, reason: string): Promise<Job> {
    if (!env.useMocks) {
      const response = await unwrap(
        api.post(`/admin/jobs/${id}/cancel`, { reason }),
      );
      return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
    }

    await delay();
    const job = findMock(id);
    job.cancellationReason = reason;

    return transition(
      job,
      'CANCELLED',
      `Cancelled by Fundi admin: ${reason}`,
    );
  },

  async reassign(id: string, technician: JobParty): Promise<Job> {
    if (!env.useMocks) {
      const response = await unwrap(
        api.post(`/admin/jobs/${id}/reassign`, {
          technicianId: technician.id,
        }),
      );
      return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
    }

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

  async create(input: JobInput): Promise<Job> {
    if (!env.useMocks) {
      const jobInput = input as BackendJobInput;

      validateJobLocationAndPayment(jobInput);

      if (!jobInput.problem.trim() || !jobInput.location.trim()) {
        throw new ApiError(
          'Problem description and service address are required.',
          400,
        );
      }

      const categoryId = await getBackendCategoryId(jobInput.service);

      const payload = {
        customerId: jobInput.customerId,
        serviceCategoryId: categoryId,
        description: jobInput.problem.trim(),
        locationAddress: jobInput.location.trim(),
        latitude: jobInput.latitude,
        longitude: jobInput.longitude,
        offeredAmount: jobInput.offeredAmount,
        priority: backendPriority(jobInput.urgency),
      };

      const response = await unwrap(
        api.post('/admin/jobs', payload),
      );

      return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
    }

    await delay();

    const partyType = input.partyType ?? 'customer';

    const account =
      partyType === 'customer'
        ? mockDb.customers.find((c) => c.id === input.customerId)
        : mockDb.technicians.find((t) => t.id === input.customerId);

    if (!account) {
      throw new MockNotFoundError(
        partyType === 'customer' ? 'Customer' : 'Technician',
        input.customerId,
      );
    }

    const service = findService(input.service);
    const now = new Date().toISOString();

    const number =
      Math.max(
        1040,
        ...mockDb.jobs.map((j) => Number(j.reference.slice(3)) || 0),
      ) + 1;

    const job: Job = {
      id: `job_${Date.now()}`,
      reference: `FD-${number}`,
      service: service.name,
      problem: input.problem.trim(),
      urgency: input.urgency,
      location: input.location.trim(),
      customer: {
        id: account.id,
        name: account.name,
        phone: account.phone,
      },
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

  async update(id: string, input: JobEditInput): Promise<Job> {
    if (!env.useMocks) {
      const edit = input as JobEditInput & Partial<JobLocationAndPayment>;

      const categoryId = await getBackendCategoryId(edit.service);

      const payload = {
        serviceCategoryId: categoryId,
        description: edit.problem.trim(),
        locationAddress: edit.location.trim(),
        ...(edit.latitude !== undefined ? { latitude: edit.latitude } : {}),
        ...(edit.longitude !== undefined ? { longitude: edit.longitude } : {}),
        ...(edit.offeredAmount !== undefined
          ? { offeredAmount: edit.offeredAmount }
          : {}),
        priority: backendPriority(edit.urgency),
      };

      const response = await unwrap(
        api.patch(`/admin/jobs/${id}`, payload),
      );

      return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
    }

    await delay();
    const job = findMock(id);

    if (!canEdit(job)) {
      throw new ApiError(
        'This job can no longer be edited because the visit fee has been paid.',
        409,
      );
    }

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

  async rate(_jobId: string, _rating: Rating): Promise<Job> {
    if (!env.useMocks) {
      throw new ApiError(
        'Job rating is not currently supported by the backend API.',
        501,
      );
    }

    await delay();
    const job = findMock(_jobId);

    const overall = Number(
      (
        (_rating.quality +
          _rating.professionalism +
          _rating.arrival +
          _rating.communication +
          _rating.value) /
        5
      ).toFixed(1),
    );

    const nextRating = {
      ..._rating,
      comment: _rating.comment.trim(),
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
      throw new ApiError(
        'Jobs with payments cannot be deleted. Cancel the job instead to keep its record.',
        409,
      );
    }

    mockDb.jobs = mockDb.jobs.filter((j) => j.id !== id);
  },
};

function findService(name: string): Service {
  const service = mockDb.services.find((s) => s.name === name);

  if (!service) {
    throw new ApiError(
      `The service "${name}" does not exist.`,
      400,
    );
  }

  return service;
}

const feeFor = (service: Service, urgency: Urgency) =>
  urgency === 'Emergency'
    ? service.emergencyVisitFee
    : service.visitFee;
