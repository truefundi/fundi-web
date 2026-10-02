'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Field, Textarea } from './Form';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'dialog',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** `drawer` slides in from the right (edit forms); `dialog` is centred. */
  variant?: 'dialog' | 'drawer';
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Latest onClose without re-running the open effect (which would steal focus on every render)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const drawer = variant === 'drawer';
  return (
    <div className={cn('fixed inset-0 z-50 flex', drawer ? 'justify-end' : 'items-center justify-center p-4')}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex flex-col bg-white shadow-xl focus:outline-none',
          drawer ? 'h-full w-full max-w-md' : 'max-h-[90vh] w-full max-w-md rounded-xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded-md p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  destructive,
  loading,
  reasonLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  /** Ask for a required reason (e.g. rejecting a verification). */
  reasonLabel?: string;
}) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const reasonId = useId();

  useEffect(() => {
    if (open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  const reasonMissing = Boolean(reasonLabel) && reason.trim().length < 5;
  const submit = () => {
    setTouched(true);
    if (!reasonMissing) onConfirm(reason.trim());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={submit} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{description}</p>
      {reasonLabel && (
        <div className="mt-4">
          <Field
            label={reasonLabel}
            htmlFor={reasonId}
            error={touched && reasonMissing ? 'Please give a reason (at least 5 characters).' : undefined}
            hint="The technician will see this reason."
          >
            <Textarea
              id={reasonId}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              invalid={touched && reasonMissing}
              placeholder="e.g. National ID photo is blurry — please re-upload."
            />
          </Field>
        </div>
      )}
    </Modal>
  );
}
