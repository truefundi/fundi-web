
/**
 * Job lifecycle, kept in sync with the mobile app
 * (fundi-mobile-/artifacts/site-visit-logger/constants/jobs.ts).
 */
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type JobRequestType = 'NORMAL' | 'SOS';

export const JOB_PRIORITIES: JobPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export type BookingPaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export const JOB_PRIORITY_LABEL: Record<JobPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

/**
 * Job lifecycle, kept in sync with the backend
 */
export type JobStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

/** The order a job normally moves through. */
export const JOB_FLOW: JobStatus[] = [
  'OPEN',
  'ASSIGNED',
  'COMPLETED',
];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

export type StatusTone = 'progress' | 'action' | 'success' | 'danger';

export const JOB_STATUS_TONE: Record<JobStatus, StatusTone> = {
  OPEN: 'progress',
  ASSIGNED: 'action',
  PAUSED: 'action',
  COMPLETED: 'success',
  FAILED: 'danger',
  CANCELLED: 'danger',
};

/** Groups for the admin's job list tabs. */
export type JobGroup = 'matching' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export const JOB_GROUPS: JobGroup[] = [
  'matching',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
];

export const JOB_GROUP_LABEL: Record<JobGroup, string> = {
  matching: 'Matching',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export function jobGroup(status: JobStatus): JobGroup {
  if (status === 'OPEN') return 'matching';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED' || status === 'FAILED') return 'cancelled';
  return 'in_progress';
}

export type Urgency = JobPriority;

export const URGENCIES: Urgency[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

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

/** Which account type the admin is creating a job for. */
export type JobRequestParty = 'customer' | 'technician';

/** What the admin fills in to create a job. */
export interface JobInput {
  customerId: string;
  paymentId?: string;
  phoneVerificationId?: string;
  latitude?: number;
  longitude?: number;
  offeredAmount?: number;
  partyType?: JobRequestParty;
  requestType?: JobRequestType;
  service: string;
  otherServiceName?: string;
  problem: string;
  urgency: Urgency;
  location: string;
}

/** Fields the admin may change on an existing job (the customer stays the same). */
export type JobEditInput = Omit<JobInput, 'customerId'>;

/** Who the admin decided in favour of when resolving a dispute. */
export type DisputeOutcome = 'customer' | 'technician' | 'partial';

export const DISPUTE_OUTCOME_LABEL: Record<DisputeOutcome, string> = {
  customer: 'In favour of the customer',
  technician: 'In favour of the technician',
  partial: 'Partly each',
};

export interface DisputeResolution {
  outcome: DisputeOutcome;
  /** Repair amount the customer must settle after the decision (visit fee excluded). */
  amount: number;
  note: string;
  resolvedAt: string;
  resolvedBy: string;
}

export interface Dispute {
  reason: string;
  openedBy: 'customer' | 'technician';
  openedAt: string;
  resolution?: DisputeResolution;
}

export interface Job {
  id: string;
  reference: string;
  /** Service name, as configured on the Categories page. */
  service: string;
  problem: string;
  urgency: Urgency;
  location: string;
  customer: JobParty;
  technician?: JobParty;
  status: JobStatus;

  /** Booking payment is separate from the job lifecycle status. */
  bookingPaymentStatus: BookingPaymentStatus;
  bookingFee: number;
  currency?: string;

  createdAt: string;
  /** When the job last changed status. */
  updatedAt: string;
  latitude?: number;
  longitude?: number;
  offeredAmount?: number;
  visitFee: number;
  visitPaymentMethod?: PaymentMethod;
  quote?: Quote;
  additionalWork?: AdditionalWork;
  additionalWorkApproved?: boolean;
  settlementMethod?: SettlementMethod;
  rating?: Rating;
  completedAt?: string;
  cancellationReason?: string;
  /** Present once a customer or technician has opened a dispute; kept after it is resolved. */
  dispute?: Dispute;
  events: JobEvent[];
}
