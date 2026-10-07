import type { AdditionalWork, Job, JobStatus, Quote } from '@/types/job';

/** Fundi's share of the visit fee (Project Description §8; mobile COMMISSION_RATE). */
export const COMMISSION_RATE = 0.3;

const linesTotal = (work: Quote | AdditionalWork) =>
  work.parts.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) + work.labour;

export const quoteTotal = (quote: Quote) => linesTotal(quote);
export const additionalTotal = (work: AdditionalWork) => linesTotal(work);

/** Repair total including approved extra work, before the visit fee credit. */
export function repairTotal(job: Job): number {
  const base = job.quote ? quoteTotal(job.quote) : 0;
  const extra = job.additionalWork && job.additionalWorkApproved ? additionalTotal(job.additionalWork) : 0;
  return base + extra;
}

export function visitFeeSplit(job: Job) {
  const fundi = Math.round(job.visitFee * COMMISSION_RATE * 100) / 100;
  return { fundi, technician: job.visitFee - fundi };
}

export function formatMoney(amount: number): string {
  // Whole amounts as "$75", others always with cents: "$22.50", never "$22.5".
  const digits = Number.isInteger(amount) ? 0 : 2;
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/** How long since a moment, in plain words: "12 min", "2 h 5 min", "3 d 4 h". */
export function formatWait(sinceIso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(sinceIso)) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  return hours % 24 ? `${days} d ${hours % 24} h` : `${days} d`;
}

/** Waiting longer than this needs the admin's attention: emergencies get much less time. */
export const waitLimitMinutes = (job: Job) => (job.urgency === 'Emergency' ? 15 : 60);

export const isOverdue = (job: Job, now = Date.now()) =>
  now - Date.parse(job.createdAt) > waitLimitMinutes(job) * 60_000;

/** Admin actions are only offered where the backend would allow them. */
const REASSIGNABLE: JobStatus[] = ['REQUESTED', 'MATCHING', 'OFFERED', 'ACCEPTED', 'VISIT_PAID', 'EN_ROUTE'];

export const canReassign = (job: Job) => REASSIGNABLE.includes(job.status);

/** Before the visit fee is paid, nothing has been charged, so the details can still change. */
const UNPAID: JobStatus[] = ['REQUESTED', 'MATCHING', 'OFFERED', 'ACCEPTED'];

export const canEdit = (job: Job) => UNPAID.includes(job.status);

/** Jobs with money involved are never deleted, only cancelled, so the record stays traceable. */
export const canDelete = (job: Job) => UNPAID.includes(job.status) || (job.status === 'CANCELLED' && !job.visitPaymentMethod);
export const canCancel = (job: Job) => job.status !== 'COMPLETED' && job.status !== 'CANCELLED';
