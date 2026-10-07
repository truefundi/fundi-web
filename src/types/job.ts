import type { ServiceCategory } from '@/config/services';

/**
 * Job lifecycle, kept in sync with the mobile app
 * (fundi-mobile-/artifacts/site-visit-logger/constants/jobs.ts).
 */
export type JobStatus =
  | 'REQUESTED'
  | 'MATCHING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'VISIT_PAID'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'DIAGNOSING'
  | 'DIAGNOSIS_COMPLETE'
  | 'QUOTE_PENDING'
  | 'QUOTE_APPROVED'
  | 'REPAIR_IN_PROGRESS'
  | 'ADDITIONAL_APPROVAL_REQUIRED'
  | 'REPAIR_COMPLETED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_REPORTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

/** The order a job normally moves through (exception states excluded). */
export const JOB_FLOW: JobStatus[] = [
  'REQUESTED',
  'MATCHING',
  'OFFERED',
  'ACCEPTED',
  'VISIT_PAID',
  'EN_ROUTE',
  'ARRIVED',
  'DIAGNOSING',
  'DIAGNOSIS_COMPLETE',
  'QUOTE_PENDING',
  'QUOTE_APPROVED',
  'REPAIR_IN_PROGRESS',
  'ADDITIONAL_APPROVAL_REQUIRED',
  'REPAIR_COMPLETED',
  'PAYMENT_PENDING',
  'PAYMENT_REPORTED',
  'COMPLETED',
];

/** Same wording as the mobile app, so admins and customers describe a job the same way. */
export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  REQUESTED: 'Request sent',
  MATCHING: 'Finding a technician',
  OFFERED: 'Technician found',
  ACCEPTED: 'Visit fee due',
  VISIT_PAID: 'Visit fee paid',
  EN_ROUTE: 'On the way',
  ARRIVED: 'Technician arrived',
  DIAGNOSING: 'Diagnosing',
  DIAGNOSIS_COMPLETE: 'Diagnosis complete',
  QUOTE_PENDING: 'Quote awaiting approval',
  QUOTE_APPROVED: 'Quote approved',
  REPAIR_IN_PROGRESS: 'Repair in progress',
  ADDITIONAL_APPROVAL_REQUIRED: 'Extra work needs approval',
  REPAIR_COMPLETED: 'Repair completed',
  PAYMENT_PENDING: 'Payment pending',
  PAYMENT_REPORTED: 'Payment recorded',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
};

export type StatusTone = 'progress' | 'action' | 'success' | 'danger';

export const JOB_STATUS_TONE: Record<JobStatus, StatusTone> = {
  REQUESTED: 'progress',
  MATCHING: 'progress',
  OFFERED: 'action',
  ACCEPTED: 'action',
  VISIT_PAID: 'progress',
  EN_ROUTE: 'progress',
  ARRIVED: 'progress',
  DIAGNOSING: 'progress',
  DIAGNOSIS_COMPLETE: 'progress',
  QUOTE_PENDING: 'action',
  QUOTE_APPROVED: 'progress',
  REPAIR_IN_PROGRESS: 'progress',
  ADDITIONAL_APPROVAL_REQUIRED: 'action',
  REPAIR_COMPLETED: 'progress',
  PAYMENT_PENDING: 'action',
  PAYMENT_REPORTED: 'progress',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  DISPUTED: 'danger',
};

/** Groups for the admin's job list tabs. */
export type JobGroup = 'matching' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export const JOB_GROUPS: JobGroup[] = ['matching', 'in_progress', 'completed', 'cancelled', 'disputed'];

export const JOB_GROUP_LABEL: Record<JobGroup, string> = {
  matching: 'Finding technician',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export function jobGroup(status: JobStatus): JobGroup {
  if (status === 'REQUESTED' || status === 'MATCHING' || status === 'OFFERED') return 'matching';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED') return 'cancelled';
  if (status === 'DISPUTED') return 'disputed';
  return 'in_progress';
}

export type Urgency = 'Emergency' | 'Today' | 'Schedule';

export const URGENCIES: Urgency[] = ['Emergency', 'Today', 'Schedule'];

export type SettlementMethod = 'Fundi' | 'Cash' | 'Mobile Money' | 'Other';

export type PaymentMethod = 'Card' | 'Mobile Money' | 'Fundi Wallet';

export interface QuoteLine {
  label: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  diagnosis: string;
  parts: QuoteLine[];
  labour: number;
}

export interface AdditionalWork {
  reason: string;
  parts: QuoteLine[];
  labour: number;
}

export interface Rating {
  overall: number;
  quality: number;
  professionalism: number;
  arrival: number;
  communication: number;
  value: number;
  comment: string;
}

export interface JobEvent {
  id: string;
  status: JobStatus;
  title: string;
  text: string;
  at: string;
}

/** A person on a job, denormalised the way the jobs API returns it. */
export interface JobParty {
  id: string;
  name: string;
  phone: string;
}

export interface Job {
  id: string;
  reference: string;
  service: ServiceCategory;
  problem: string;
  urgency: Urgency;
  location: string;
  customer: JobParty;
  technician?: JobParty;
  status: JobStatus;
  createdAt: string;
  /** When the job last changed status. */
  updatedAt: string;
  visitFee: number;
  visitPaymentMethod?: PaymentMethod;
  quote?: Quote;
  additionalWork?: AdditionalWork;
  additionalWorkApproved?: boolean;
  settlementMethod?: SettlementMethod;
  rating?: Rating;
  completedAt?: string;
  cancellationReason?: string;
  events: JobEvent[];
}
