import { DEFAULT_PAGE_SIZE } from '@/config/pagination';
import type { AdminPage, JobQuery, JobStats, PaginatedResponse } from '@/types/api';
import {
  mapBackendJob,
  mapBackendJobListItem,
  type BackendJobListItem,
} from '@/lib/api/adapters/jobs';
import {
  type Job,
  type JobListItem,
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
  signal?: AbortSignal,
): Promise<{ serviceCategoryId?: string; otherServiceName?: string }> {
  const custom = otherServiceName?.trim();
  if (custom) {
    return { otherServiceName: custom };
  }

  const response = await unwrap<Array<{ id: string; name: string }>>(
    api.get('/catalog/admin/services', { signal }),
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
  async list(
    query: JobQuery = {},
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<JobListItem>> {
    const { pageSize, search, ...filters } = query;
    const response = await unwrap(
      api.get<AdminPage<BackendJobListItem>>('/admin/jobs', {
        query: {
          ...filters,
          search: search?.trim() || undefined,
          page: query.page ?? 1,
          limit: pageSize ?? DEFAULT_PAGE_SIZE,
        },
        signal,
      }),
    );
    return {
      items: response.data.map(mapBackendJobListItem),
      total: response.pagination.total,
      page: response.pagination.page,
      pageSize: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    };
  },

  // The paginated contract omits ratings. Keep the existing ratings screen on
  // the legacy representation until a global rating-list endpoint is available.
  async rated(signal?: AbortSignal): Promise<Job[]> {
    const rows = await unwrap(
      api.get<Parameters<typeof mapBackendJob>[0][]>('/admin/jobs', { signal }),
    );
    return rows.map(mapBackendJob).filter((job) => job.rating);
  },

  async get(id: string, signal?: AbortSignal): Promise<Job> {
    const response = await unwrap(api.get(`/admin/jobs/${id}`, { signal }));
    return mapBackendJob(response as Parameters<typeof mapBackendJob>[0]);
  },

  async stats(signal?: AbortSignal): Promise<JobStats> {
    return unwrap(api.get('/admin/jobs/summary', { signal }));
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
