import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import { customersApi } from './customers';
import { disputesApi } from './disputes';
import { jobsApi } from './jobs';
import { techniciansApi } from './technicians';
import { api, ApiError, unwrap } from '../client';
import {
  canApproveRequest,
  getActionPrivilege,
  type ApprovalActor,
  type ApprovalRequest,
  type ApprovalStatus,
  type CreateApprovalInput,
} from '@/types/approval';

const COMMISSION_STORAGE_KEY = 'fundi.commission-rate-percent';
const COMMISSION_EVENT = 'fundi-commission-rate';

function findMock(id: string): ApprovalRequest {
  const request = mockDb.approvalRequests.find((item) => item.id === id);
  if (!request) throw new MockNotFoundError('Approval request', id);
  return request;
}

function applyCommissionRate(rate: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COMMISSION_STORAGE_KEY, String(rate));
  window.dispatchEvent(new CustomEvent(COMMISSION_EVENT, { detail: rate }));
}

async function applyApprovedAction(request: ApprovalRequest): Promise<void> {
  switch (request.actionType) {
    case 'VERIFY_USER':
      await techniciansApi.approve(request.resourceId, request.verificationChecklist);
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
  async list(status?: ApprovalStatus): Promise<ApprovalRequest[]> {
    if (!env.useMocks) return unwrap(api.get('/admin/approvals', { query: { status } }));
    await delay();
    const items = status ? mockDb.approvalRequests.filter((item) => item.status === status) : mockDb.approvalRequests;
    return clone([...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
  },

  async get(id: string): Promise<ApprovalRequest> {
    if (!env.useMocks) return unwrap(api.get(`/admin/approvals/${id}`));
    await delay();
    return clone(findMock(id));
  },

  async create(input: CreateApprovalInput, requester: ApprovalActor): Promise<ApprovalRequest> {
    if (!env.useMocks) return unwrap(api.post('/admin/approvals', { ...input, requester }));
    await delay();
    const duplicate = mockDb.approvalRequests.find(
      (item) =>
        item.status === 'PENDING' &&
        item.actionType === input.actionType &&
        item.resourceId === input.resourceId,
    );
    if (duplicate) {
      throw new ApiError('An approval request for this action is already pending.', 409);
    }
    const privilege = getActionPrivilege(input.actionType);
    const request: ApprovalRequest = {
      id: `apr_${Date.now()}`,
      actionType: input.actionType,
      title: privilege.title,
      category: privilege.category,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      resourceName: input.resourceName,
      summary: input.summary,
      status: 'PENDING',
      requester,
      createdAt: new Date().toISOString(),
      verificationChecklist: input.verificationChecklist,
      metadata: input.metadata,
    };
    mockDb.approvalRequests.unshift(request);
    return clone(request);
  },

  async review(
    id: string,
    decision: { status: Exclude<ApprovalStatus, 'PENDING'>; notes?: string },
    reviewer: ApprovalActor,
  ): Promise<ApprovalRequest> {
    if (!env.useMocks) return unwrap(api.post(`/admin/approvals/${id}/review`, { ...decision, reviewer }));
    await delay();
    const request = findMock(id);
    if (request.status !== 'PENDING') throw new ApiError('This request has already been reviewed.', 409);
    if (!canApproveRequest(reviewer.role, request.actionType)) {
      throw new ApiError('Your role cannot approve this action. Ask a Super Admin or Operations Manager.', 403);
    }
    if (request.requester.id === reviewer.id && reviewer.role !== 'SUPER_ADMIN') {
      throw new ApiError('Ask another admin with direct approval rights to review this request.', 403);
    }
    if (decision.status === 'APPROVED') {
      await applyApprovedAction(request);
    }
    request.status = decision.status;
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = reviewer;
    request.reviewNotes = decision.notes?.trim() || undefined;
    if (decision.status === 'REJECTED') {
      request.rejectionReason = decision.notes?.trim() || 'Rejected';
    }
    return clone(request);
  },
};
