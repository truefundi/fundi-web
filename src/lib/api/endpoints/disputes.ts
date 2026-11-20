import { mapBackendConversation, type BackendConversation } from '@/lib/api/adapters/chats';
import { mapBackendJob, type BackendJob } from '@/lib/api/adapters/jobs';
import type { Conversation } from '@/types/chat';
import type { DisputeOutcome, Job } from '@/types/job';
import { api, unwrap } from '../client';

export type DisputeState = 'open' | 'resolved';

export interface DisputeDecision {
  outcome: DisputeOutcome;
  /** Repair amount the customer must settle (visit fee excluded). */
  amount: number;
  note: string;
}

/** A disputed job together with the chat where the customer and technician agreed on it. */
export interface DisputeCase {
  job: Job;
  chat?: Conversation;
}

const OUTCOME_TO_API: Record<DisputeOutcome, 'CUSTOMER' | 'TECHNICIAN' | 'PARTIAL'> = {
  customer: 'CUSTOMER',
  technician: 'TECHNICIAN',
  partial: 'PARTIAL',
};

export const disputesApi = {
  async list(state: DisputeState): Promise<Job[]> {
    const response = await unwrap<BackendJob[]>(api.get('/admin/disputes', { query: { state } }));
    return (response || []).map(mapBackendJob);
  },

  async get(jobId: string): Promise<DisputeCase> {
    const response = await unwrap<{ job: BackendJob; chat?: BackendConversation | null }>(
      api.get(`/admin/disputes/${jobId}`),
    );
    return {
      job: mapBackendJob(response.job),
      chat: response.chat ? mapBackendConversation(response.chat) : undefined,
    };
  },

  /** Records the decision; the job then moves on to settling the decided amount. */
  async resolve(jobId: string, decision: DisputeDecision): Promise<Job> {
    const payload = {
      outcome: OUTCOME_TO_API[decision.outcome] ?? (decision.outcome.toUpperCase() as 'CUSTOMER' | 'TECHNICIAN' | 'PARTIAL'),
      amount: Math.max(0, Math.round(decision.amount)),
      note: decision.note.trim(),
    };
    const response = await unwrap<BackendJob>(api.post(`/admin/disputes/${jobId}/resolve`, payload));
    return mapBackendJob(response);
  },
};