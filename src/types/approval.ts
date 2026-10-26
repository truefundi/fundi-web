export type AdminRole = 'SUPER_ADMIN' | 'OPERATIONS_MANAGER' | 'SUPPORT_AGENT';

export const ADMIN_ROLES: { value: AdminRole; label: string; description: string; badgeTone: 'success' | 'warning' | 'progress' }[] = [
  {
    value: 'SUPER_ADMIN',
    label: 'Super Admin',
    description: 'Full platform authority. Direct approval for all actions, commission changes, and user management.',
    badgeTone: 'success',
  },
  {
    value: 'OPERATIONS_MANAGER',
    label: 'Operations Manager',
    description: 'Manages day-to-day operations. Can directly approve user verifications and disputes; requires approval for system-wide deletions.',
    badgeTone: 'progress',
  },
  {
    value: 'SUPPORT_AGENT',
    label: 'Support Agent / Reviewer',
    description: 'First-line reviewer. Reviews submitted documents and phone records; requests approval from senior admins for approvals and suspensions.',
    badgeTone: 'warning',
  },
];

export type ApprovalActionType =
  | 'VERIFY_USER'
  | 'SUSPEND_ACCOUNT'
  | 'DELETE_USER'
  | 'CHANGE_COMMISSION'
  | 'RESOLVE_DISPUTE'
  | 'FORCE_CANCEL_JOB';

export type PermissionLevel = 'DIRECT' | 'REQUIRES_APPROVAL' | 'RESTRICTED';

export interface ActionPrivilegeDefinition {
  actionType: ApprovalActionType;
  title: string;
  category: 'User Onboarding' | 'Account Governance' | 'Financial & Business' | 'Operations & Jobs';
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  permissions: Record<AdminRole, PermissionLevel>;
}

export const PRIVILEGE_MATRIX: ActionPrivilegeDefinition[] = [
  {
    actionType: 'VERIFY_USER',
    title: 'Approve Technician / User Verification',
    category: 'User Onboarding',
    description: 'Approve user after verifying Certificate, National ID, and Phone Number match.',
    riskLevel: 'MEDIUM',
    permissions: {
      SUPER_ADMIN: 'DIRECT',
      OPERATIONS_MANAGER: 'DIRECT',
      SUPPORT_AGENT: 'REQUIRES_APPROVAL',
    },
  },
  {
    actionType: 'SUSPEND_ACCOUNT',
    title: 'Suspend / Restrict Account',
    category: 'Account Governance',
    description: 'Temporarily disable technician or customer access due to compliance or dispute issues.',
    riskLevel: 'HIGH',
    permissions: {
      SUPER_ADMIN: 'DIRECT',
      OPERATIONS_MANAGER: 'DIRECT',
      SUPPORT_AGENT: 'REQUIRES_APPROVAL',
    },
  },
  {
    actionType: 'DELETE_USER',
    title: 'Delete User Account & Profile',
    category: 'Account Governance',
    description: 'Permanently remove an account and associated profile records from the platform.',
    riskLevel: 'CRITICAL',
    permissions: {
      SUPER_ADMIN: 'DIRECT',
      OPERATIONS_MANAGER: 'REQUIRES_APPROVAL',
      SUPPORT_AGENT: 'RESTRICTED',
    },
  },
  {
    actionType: 'CHANGE_COMMISSION',
    title: 'Update Platform Commission Rate',
    category: 'Financial & Business',
    description: 'Adjust the global percentage split for visit fees between Fundi and technicians.',
    riskLevel: 'CRITICAL',
    permissions: {
      SUPER_ADMIN: 'DIRECT',
      OPERATIONS_MANAGER: 'REQUIRES_APPROVAL',
      SUPPORT_AGENT: 'RESTRICTED',
    },
  },
  {
    actionType: 'RESOLVE_DISPUTE',
    title: 'Dispute Settlement & Financial Resolution',
    category: 'Financial & Business',
    description: 'Issue official binding resolution and fund distribution on customer/technician disputes.',
    riskLevel: 'HIGH',
    permissions: {
      SUPER_ADMIN: 'DIRECT',
      OPERATIONS_MANAGER: 'DIRECT',
      SUPPORT_AGENT: 'REQUIRES_APPROVAL',
    },
  },
  {
    actionType: 'FORCE_CANCEL_JOB',
    title: 'Force-Cancel Active In-Progress Job',
    category: 'Operations & Jobs',
    description: 'Administrative emergency cancellation of a confirmed, en-route, or in-progress repair.',
    riskLevel: 'MEDIUM',
    permissions: {
      SUPER_ADMIN: 'DIRECT',
      OPERATIONS_MANAGER: 'DIRECT',
      SUPPORT_AGENT: 'REQUIRES_APPROVAL',
    },
  },
];

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerificationChecklistPayload {
  phoneMatched: boolean;
  phoneNumber: string;
  phoneCarrier?: string;
  idMatched: boolean;
  idNumber: string;
  idDocumentName: string;
  certificateMatched: boolean;
  tradesVerified: string[];
  reviewerNotes?: string;
}

export interface ApprovalRequest {
  id: string;
  actionType: ApprovalActionType;
  title: string;
  category: string;
  resourceType: 'technician' | 'customer' | 'job' | 'dispute' | 'settings';
  resourceId: string;
  resourceName: string;
  summary: string;
  status: ApprovalStatus;
  requester: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
  };
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
  };
  reviewNotes?: string;
  rejectionReason?: string;
  verificationChecklist?: VerificationChecklistPayload;
  metadata?: Record<string, unknown>;
}

export function getActionPrivilege(actionType: ApprovalActionType): ActionPrivilegeDefinition {
  const found = PRIVILEGE_MATRIX.find((item) => item.actionType === actionType);
  if (!found) {
    throw new Error(`Unknown action type: ${actionType}`);
  }
  return found;
}

export function canPerformDirectly(role: AdminRole, actionType: ApprovalActionType): boolean {
  return getActionPrivilege(actionType).permissions[role] === 'DIRECT';
}

export function canRequestApproval(role: AdminRole, actionType: ApprovalActionType): boolean {
  const perm = getActionPrivilege(actionType).permissions[role];
  return perm === 'REQUIRES_APPROVAL' || perm === 'DIRECT';
}

export function canApproveRequest(role: AdminRole, actionType: ApprovalActionType): boolean {
  return getActionPrivilege(actionType).permissions[role] === 'DIRECT';
}

export const PERMISSION_LABEL: Record<PermissionLevel, string> = {
  DIRECT: 'Direct approval',
  REQUIRES_APPROVAL: 'Request approval',
  RESTRICTED: 'No access',
};

export interface CreateApprovalInput {
  actionType: ApprovalActionType;
  resourceType: ApprovalRequest['resourceType'];
  resourceId: string;
  resourceName: string;
  summary: string;
  verificationChecklist?: VerificationChecklistPayload;
  metadata?: Record<string, unknown>;
}

export interface ApprovalActor {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export function permissionFor(role: AdminRole, actionType: ApprovalActionType): PermissionLevel {
  return getActionPrivilege(actionType).permissions[role];
}
