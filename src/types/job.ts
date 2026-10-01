/**
 * Job lifecycle statuses, kept in sync with the mobile app
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

export type StatusTone = 'progress' | 'action' | 'success' | 'danger';
