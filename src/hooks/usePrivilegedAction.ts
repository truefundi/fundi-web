'use client';

import { useAuth } from '@/context/AuthContext';
import { useCreateApproval } from './useApprovals';
import { useToast } from '@/components/ui';
import {
  permissionFor,
  type ApprovalActionType,
  type ApprovalActor,
  type CreateApprovalInput,
} from '@/types/approval';

export type PrivilegedOutcome = 'executed' | 'requested' | 'blocked';

function actorFromUser(user: { id: string; name?: string; email: string; role: ApprovalActor['role'] }): ApprovalActor {
  return {
    id: user.id,
    name: user.name?.trim() || user.email,
    email: user.email,
    role: user.role,
  };
}

export function usePrivilegedAction() {
  const { user } = useAuth();
  const createApproval = useCreateApproval();
  const toast = useToast();

  const run = async (
    input: CreateApprovalInput & { execute: () => Promise<unknown> },
  ): Promise<PrivilegedOutcome> => {
    if (!user) {
      toast('Sign in again to continue.', 'error');
      return 'blocked';
    }

    const permission = permissionFor(user.role, input.actionType);
    if (permission === 'RESTRICTED') {
      toast('Your role cannot perform this action. Ask a Super Admin.', 'error');
      return 'blocked';
    }

    if (permission === 'REQUIRES_APPROVAL') {
      const { execute: _execute, ...payload } = input;
      await createApproval.mutateAsync({ input: payload, requester: actorFromUser(user) });
      toast('Approval requested. A senior admin will review it on the Approvals page.');
      return 'requested';
    }

    await input.execute();
    return 'executed';
  };

  return {
    run,
    role: user?.role,
    permissionFor: (actionType: ApprovalActionType) => (user ? permissionFor(user.role, actionType) : 'RESTRICTED'),
    actor: user ? actorFromUser(user) : null,
    isPending: createApproval.isPending,
  };
}
