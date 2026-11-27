import { customersApi } from './customers';
import { disputesApi } from './disputes';
import { jobsApi } from './jobs';
import { techniciansApi } from './technicians';
import { api, ApiError, unwrap } from '../client';
import type {
  ApprovalActor,
  ApprovalRequest,
  ApprovalStatus,
  CreateApprovalInput,
} from '@/types/approval';

const COMMISSION_STORAGE_KEY = 'fundi.commission-rate-percent';
const COMMISSION_EVENT = 'fundi-commission-rate';

function applyCommissionRate(rate: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COMMISSION_STORAGE_KEY, String(rate));
  window.dispatchEvent(new CustomEvent(COMMISSION_EVENT, { detail: rate }));
}

async function applyApprovedAction(request: ApprovalRequest): Promise<void> {
  switch (request.actionType) {
    case 'VERIFY_USER':
      await techniciansApi.approve(request.resourceId);
      return;
    case 'SUSPEND_ACCOUNT':
      if (request.resourceType === 'customer') {
        await customersApi.updateStatus(request.resourceId, 'suspended');
      } else {
        await techniciansApi.updateStatus(request.resourceId, 'suspended');
      }
      return;
    case 'DELETE_USER':
      await techniciansApi.remove(request.resourceId);
      return;
    case 'CHANGE_COMMISSION': {
      const rate = Number(request.metadata?.rate);
      if (!Number.isFinite(rate)) throw new ApiError('Commission rate is missing from this request.', 400);
      applyCommissionRate(rate);
      return;
    }
    case 'RESOLVE_DISPUTE': {
      const outcome = request.metadata?.outcome;
      const amount = Number(request.metadata?.amount);
      const note = String(request.metadata?.note ?? '');
      if (outcome !== 'customer' && outcome !== 'technician' && outcome !== 'partial') {
        throw new ApiError('Dispute outcome is missing from this request.', 400);
      }
      await disputesApi.resolve(request.resourceId, { outcome, amount, note });
      return;
    }
    case 'FORCE_CANCEL_JOB':
      await jobsApi.cancel(request.resourceId, String(request.metadata?.reason ?? 'Cancelled after admin approval'));
      return;
    default:
      throw new ApiError('This action type cannot be applied automatically.', 400);
  }
}

export const approvalsApi = {
  async list(
    status?: ApprovalStatus,
    signal?: AbortSignal,
  ): Promise<ApprovalRequest[]> {
    return unwrap(api.get('/admin/approvals', { query: { status }, signal }));
  },

  async get(id: string, signal?: AbortSignal): Promise<ApprovalRequest> {
    return unwrap(api.get(`/admin/approvals/${id}`, { signal }));
  },

  async create(input: CreateApprovalInput, requester: ApprovalActor): Promise<ApprovalRequest> {
    return unwrap(api.post('/admin/approvals', { ...input, requester }));
  },

  async review(
    id: string,
    decision: { status: Exclude<ApprovalStatus, 'PENDING'>; notes?: string },
    reviewer: ApprovalActor,
  ): Promise<ApprovalRequest> {
    const reviewed = await unwrap<ApprovalRequest>(
      api.post(`/admin/approvals/${id}/review`, { ...decision, reviewer }),
    );
    if (decision.status === 'APPROVED') {
      await applyApprovedAction(reviewed);
    }
    return reviewed;
  },
};