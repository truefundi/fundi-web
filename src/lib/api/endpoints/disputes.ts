import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import type { Conversation } from '@/types/chat';
import { DISPUTE_OUTCOME_LABEL, JOB_STATUS_LABEL, type DisputeOutcome, type Job } from '@/types/job';
import { api, ApiError, unwrap } from '../client';

/** Reviewer recorded on mock decisions; the real API takes it from the admin session. */
const MOCK_REVIEWER = 'Fundi Admin';

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

const isOpen = (job: Job) => Boolean(job.dispute && !job.dispute.resolution);

function findDisputed(jobId: string): Job {
  const job = mockDb.jobs.find((j) => j.id === jobId && j.dispute);
  if (!job) throw new MockNotFoundError('Dispute', jobId);
  return job;
}

export const disputesApi = {
  async list(state: DisputeState): Promise<Job[]> {
    if (!env.useMocks) return unwrap(api.get('/admin/disputes', { query: { state } }));
    await delay();
    return clone(
      mockDb.jobs
        .filter((j) => j.dispute && (state === 'open' ? isOpen(j) : !isOpen(j)))
        .sort((a, b) => Date.parse(b.dispute!.openedAt) - Date.parse(a.dispute!.openedAt)),
    );
  },

  async get(jobId: string): Promise<DisputeCase> {
    if (!env.useMocks) return unwrap(api.get(`/admin/disputes/${jobId}`));
    await delay();
    const job = findDisputed(jobId);
    const chat = mockDb.chats.find((c) => c.jobId === jobId);
    return clone({ job, chat });
  },

  /** Records the decision; the job then moves on to settling the decided amount. */
  async resolve(jobId: string, decision: DisputeDecision): Promise<Job> {
    if (!env.useMocks) return unwrap(api.post(`/admin/disputes/${jobId}/resolve`, decision));
    await delay();
    const job = findDisputed(jobId);
    if (!isOpen(job)) throw new ApiError('This dispute has already been resolved.', 409);

    const at = new Date().toISOString();
    job.dispute = {
      ...job.dispute!,
      resolution: { ...decision, note: decision.note.trim(), resolvedAt: at, resolvedBy: MOCK_REVIEWER },
    };
    job.status = 'PAYMENT_PENDING';
    job.updatedAt = at;
    job.events.push({
      id: `evt_${job.id}_${job.events.length + 1}`,
      status: 'PAYMENT_PENDING',
      title: JOB_STATUS_LABEL.PAYMENT_PENDING,
      text: `Dispute resolved by Fundi admin (${DISPUTE_OUTCOME_LABEL[decision.outcome].toLowerCase()}): ${decision.note.trim()} The customer settles $${decision.amount}.`,
      at,
    });
    return clone(job);
  },
};
