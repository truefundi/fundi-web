import { DEFAULT_PAGE_SIZE } from '@/config/pagination';
import type { JobQuery, JobStats, PaginatedResponse } from '@/types/api';
import { mapBackendJob } from '@/lib/api/adapters/jobs';
import {
  jobGroup,
  type Job,
  type JobEditInput,
  type JobInput,
  type JobParty,
  type Rating,
  type Urgency,
} from '@/types/job';
import { api, ApiError, unwrap } from '../client';

type JobLocationAndPayment = {
  latitude: number;
  longitude: number;
  offeredAmount: number;
};

type BackendJobInput = JobInput & JobLocationAndPayment;

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

  if (
    !Number.isInteger(input.offeredAmount) ||
    input.offeredAmount <= 0 ||
    input.offeredAmount > 2_000_000_000
  ) {
    throw new ApiError('Please enter a valid technician payment amount.', 400);
  }
}

async function resolveServiceTarget(
  serviceName: string,
  otherServiceName?: string,
): Promise<{ serviceCategoryId?: string; otherServiceName?: string }> {
  const custom = otherServiceName?.trim();
  if (custom) {
    return { otherServiceName: custom };
  }

  const response = await unwrap<Array<{ id: string; name: string }>>(
    api.get('/catalog/admin/services'),
  );

  const selectedService = response.find(
    (service) =>
      service.name.trim().toLowerCase() === serviceName.trim().toLowerCase(),
  );

  if (!selectedService) {
    throw new ApiError(`Service "${serviceName}" was not found.`, 400);
  }

  return { serviceCategoryId: selectedService.id };
}

function backendPriority(urgency: Urgency): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' {
  return urgency;
}

export const jobsApi = {
  async list(query: JobQuery = {}): Promise<PaginatedResponse<Job>> {
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
          (!query.group || jobGroup(job) === query.group) &&
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
  },

  async get(id: string): Promise<Job> {
    const response = await unwrap(api.get(`/admin/jobs/${id}`));
    return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
  },

  async stats(): Promise<JobStats> {
    return unwrap(api.get('/admin/jobs/summary'));
  },

  async cancel(id: string, reason: string): Promise<Job> {
    const response = await unwrap(
      api.post(`/admin/jobs/${id}/cancel`, { reason }),
    );

    return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
  },

  async reassign(id: string, technician: JobParty): Promise<Job> {
    const response = await unwrap(
      api.post(`/admin/jobs/${id}/reassign`, {
        technicianId: technician.id,
      }),
    );

    return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
  },

  async create(input: JobInput): Promise<Job> {
    const jobInput = input as BackendJobInput;

    validateJobLocationAndPayment(jobInput);

    if (!jobInput.problem.trim() || !jobInput.location.trim()) {
      throw new ApiError(
        'Problem description and service address are required.',
        400,
      );
    }

    if (!jobInput.paymentId) {
      throw new ApiError(
        'A valid booking payment reference is required for this customer.',
        400,
      );
    }

    const serviceTarget = await resolveServiceTarget(
      jobInput.service,
      jobInput.otherServiceName,
    );

    const payload = {
      customerId: jobInput.customerId,
      paymentId: jobInput.paymentId,
      ...(jobInput.phoneVerificationId?.trim()
        ? { phoneVerificationId: jobInput.phoneVerificationId.trim() }
        : {}),
      ...serviceTarget,
      description: jobInput.problem.trim(),
      locationAddress: jobInput.location.trim(),
      latitude: jobInput.latitude,
      longitude: jobInput.longitude,
      offeredAmount: jobInput.offeredAmount,
      requestType: jobInput.requestType ?? 'NORMAL',
      priority: backendPriority(jobInput.urgency),
    };

    const response = await unwrap(
      api.post('/admin/jobs', payload),
    );

    return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
  },

  async update(id: string, input: JobEditInput): Promise<Job> {
    const edit = input as JobEditInput & Partial<JobLocationAndPayment>;

    const serviceTarget = await resolveServiceTarget(
      edit.service,
      edit.otherServiceName,
    );

    const payload = {
      ...serviceTarget,
      description: edit.problem.trim(),
      locationAddress: edit.location.trim(),
      ...(edit.latitude !== undefined ? { latitude: edit.latitude } : {}),
      ...(edit.longitude !== undefined ? { longitude: edit.longitude } : {}),
      ...(edit.offeredAmount !== undefined
        ? { offeredAmount: edit.offeredAmount }
        : {}),
      ...(edit.requestType ? { requestType: edit.requestType } : {}),
      priority: backendPriority(edit.urgency),
    };

    const response = await unwrap(
      api.patch(`/admin/jobs/${id}`, payload),
    );

    return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
  },

  async rate(jobId: string, rating: Rating): Promise<Job> {
    const response = await unwrap(
      api.post(`/admin/jobs/${jobId}/rating`, {
        ...rating,
        overall: Math.round(rating.overall),
      }),
    );

    return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
  },

  async remove(id: string): Promise<void> {
    await unwrap(api.delete(`/admin/jobs/${id}`));
  },
};