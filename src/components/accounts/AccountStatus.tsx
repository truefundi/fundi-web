'use client';

import { useState } from 'react';
import { Ban, RotateCcw } from 'lucide-react';
import { Badge, Button, ConfirmDialog, useToast, type BadgeTone } from '@/components/ui';
import { ACCOUNT_STATUS_LABEL, type AccountStatus } from '@/types/customer';

const tone: Record<AccountStatus, BadgeTone> = { active: 'success', suspended: 'danger', inactive: 'neutral' };

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <Badge tone={tone[status]} icon={<span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}>
      {ACCOUNT_STATUS_LABEL[status]}
    </Badge>
  );
}

/** Suspend / Reactivate button with a confirm step. Works for customers and technicians. */
export function AccountStatusAction({
  name,
  status,
  onChange,
  loading,
  size = 'sm',
}: {
  name: string;
  status: AccountStatus;
  /** Performs the mutation; resolves on success, throws on failure. */
  onChange: (status: AccountStatus) => Promise<unknown>;
  loading?: boolean;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const suspending = status === 'active';

  const confirm = async () => {
    try {
      await onChange(suspending ? 'suspended' : 'active');
      toast(suspending ? `${name} has been suspended` : `${name} has been reactivated`);
      setOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update account status', 'error');
    }
  };

  return (
    // Stop clicks (including inside the dialog) from reaching a clickable table row
    <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Button
        variant="secondary"
        size={size}
        className={suspending ? 'text-red-600' : undefined}
        onClick={() => setOpen(true)}
      >
        {suspending ? <Ban className="h-4 w-4" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
        {suspending ? 'Suspend' : 'Reactivate'}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        loading={loading}
        destructive={suspending}
        title={suspending ? `Suspend ${name}?` : `Reactivate ${name}?`}
        description={
          suspending
            ? 'They will be signed out and cannot use Fundi until reactivated. You can undo this at any time.'
            : 'They will regain access to Fundi immediately.'
        }
        confirmLabel={suspending ? 'Suspend account' : 'Reactivate'}
      />
    </span>
  );
}
