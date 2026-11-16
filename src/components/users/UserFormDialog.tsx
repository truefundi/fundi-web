'use client';

import { useEffect, useId, useState } from 'react';
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  useToast,
} from '@/components/ui';
import { USER_ROLE_LABELS, type UserRole } from '@/types/user';

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];

type UserFormValues = {
  name: string;
  email: string;
  phone: string;
  role: UserRole | '';
};

const EMPTY: UserFormValues = {
  name: '',
  email: '',
  phone: '',
  role: '',
};

type Errors = Partial<Record<keyof UserFormValues, string>>;

function validate(input: UserFormValues): Errors {
  const errors: Errors = {};

  if (!input.name.trim()) {
    errors.name = 'Enter a full name.';
  }
  if (!input.email.trim() || !input.email.includes('@')) {
    errors.email = 'Enter a valid email address.';
  }
  if (!input.phone.trim()) {
    errors.phone = 'Enter a phone number.';
  }
  if (!input.role) {
    errors.role = 'Select a staff role.';
  }

  return errors;
}

export function UserFormDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const id = useId();
  const toast = useToast();

  const [input, setInput] = useState<UserFormValues>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInput(EMPTY);
    setTouched(false);
  }, [open]);

  const set = <K extends keyof UserFormValues>(
    key: K,
    value: UserFormValues[K],
  ) => {
    setInput((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const save = async () => {
    setTouched(true);
    const validationErrors = validate(input);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      toast(`${input.name} added successfully`, 'success');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not create user';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const errors = touched ? validate(input) : {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add administrative staff"
      description="Create a new account for a Super Admin, Admin Support, or Accountant."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={save} loading={loading} disabled={loading}>
            Add staff member
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Field label="Full Name" htmlFor={`${id}-name`} error={errors.name}>
          <Input
            id={`${id}-name`}
            value={input.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Jean Bosco"
            invalid={Boolean(errors.name)}
          />
        </Field>

        <Field label="Email Address" htmlFor={`${id}-email`} error={errors.email}>
          <Input
            id={`${id}-email`}
            type="email"
            value={input.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="e.g. jean@fundi.rw"
            invalid={Boolean(errors.email)}
          />
        </Field>

        <Field label="Phone Number" htmlFor={`${id}-phone`} error={errors.phone}>
          <Input
            id={`${id}-phone`}
            value={input.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="e.g. +250 788 000 000"
            invalid={Boolean(errors.phone)}
          />
        </Field>

        <Field label="Management Role" htmlFor={`${id}-role`} error={errors.role}>
          <Select
            id={`${id}-role`}
            value={input.role}
            onChange={(e) => set('role', e.target.value as UserRole)}
            invalid={Boolean(errors.role)}
          >
            <option value="">Select staff role</option>
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {USER_ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}