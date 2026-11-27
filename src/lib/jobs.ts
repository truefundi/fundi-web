
import type { AdditionalWork, Job, Quote } from '@/types/job';

/** Fundi's share of the visit fee. */
export const COMMISSION_RATE = 0.3;

const linesTotal = (work: Quote | AdditionalWork) =>
  work.parts.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) + work.labour;

export const quoteTotal = (quote: Quote) => linesTotal(quote);
export const additionalTotal = (work: AdditionalWork) => linesTotal(work);

/**
 * Repair total including approved extra work, before the visit fee credit.
 * Once a dispute is resolved, the amount the admin decided replaces it.
 */
export function repairTotal(job: Job): number {
  if (job.dispute?.resolution) return job.dispute.resolution.amount;

  const base = job.quote ? quoteTotal(job.quote) : 0;
  const extra =
    job.additionalWork && job.additionalWorkApproved
      ? additionalTotal(job.additionalWork)
      : 0;

  return base + extra;
}

export function visitFeeSplit(job: Job, commissionRate = COMMISSION_RATE) {
  const fundi = Math.round(job.visitFee * commissionRate * 100) / 100;
  return { fundi, technician: job.visitFee - fundi };
}

export function formatMoney(amount: number): string {
  const digits = Number.isInteger(amount) ? 0 : 2;

  return `RWF ${amount.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/** Format elapsed time in plain words. */
export function formatWait(sinceIso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(sinceIso)) / 60_000));

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return minutes % 60
      ? `${hours} h ${minutes % 60} min`
      : `${hours} h`;
  }

  const days = Math.floor(hours / 24);

  return hours % 24
    ? `${days} d ${hours % 24} h`
    : `${days} d`;
}

/** Urgent jobs need admin attention sooner. */
export const waitLimitMinutes = (job: Job) =>
  job.urgency === 'URGENT' ? 15 : 60;

export const isOverdue = (job: Job, now = Date.now()) =>
  now - Date.parse(job.createdAt) > waitLimitMinutes(job) * 60_000;

/** Total billed by the technician, including unapproved extra work. */
export function billedTotal(job: Job): number {
  const base = job.quote ? quoteTotal(job.quote) : 0;
  return base + (job.additionalWork ? additionalTotal(job.additionalWork) : 0);
}

/** Total counting only work approved by the customer. */
export function approvedTotal(job: Job): number {
  const base = job.quote ? quoteTotal(job.quote) : 0;
  const extra =
    job.additionalWork && job.additionalWorkApproved
      ? additionalTotal(job.additionalWork)
      : 0;

  return base + extra;
}

/**
 * Reassignment is allowed only after booking payment is confirmed.
 * The backend currently supports reassignment for OPEN and ASSIGNED jobs.
 */
export const canReassign = (job: Job) =>
  job.bookingPaymentStatus === 'PAID' &&
  (job.status === 'OPEN' || job.status === 'ASSIGNED');

/** Pending-payment OPEN jobs can still be edited. */
export const canEdit = (job: Job) =>
  job.status === 'OPEN' && job.bookingPaymentStatus === 'PENDING';

/** Only unpaid OPEN jobs can be deleted. */
export const canDelete = (job: Job) =>
  job.status === 'OPEN' && job.bookingPaymentStatus === 'PENDING';

export const canCancel = (job: Job) =>
  job.status !== 'COMPLETED' && job.status !== 'CANCELLED';
