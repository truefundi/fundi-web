'use client';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui';
import type {
  ApprovalActionType,
  ApprovalActor,
  CreateApprovalInput,
} from '@/types/approval';

export type PrivilegedOutcome = 'executed' | 'blocked';

function actorFromUser(user: {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN';
}): ApprovalActor {
  return {
    id: user.id,
    name: user.fullName?.trim() || user.email,
    email: user.email,
    role: 'ADMIN',
  };
}

export function usePrivilegedAction() {
  const { user } = useAuth();
  const toast = useToast();

  const run = async (
    input: CreateApprovalInput & { execute: () => Promise<unknown> },
  ): Promise<PrivilegedOutcome> => {
    if (!user) {
      toast('Sign in again to continue.', 'error');
      return 'blocked';
    }

    try {
      await input.execute();
      return 'executed';
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'The action failed.',
        'error',
      );
      return 'blocked';
    }
  };

  return {
    run,
    role: user?.role,
    permissionFor: (_actionType: ApprovalActionType) =>
      user ? 'DIRECT' as const : 'RESTRICTED' as const,
    actor: user ? actorFromUser(user) : null,
    isPending: false,
  };
}