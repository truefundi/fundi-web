'use client';

import { useEffect, useId, useState } from 'react';
import { Check, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  useToast,
} from '@/components/ui';
import {
  useCreateUser,
  useUpdateUser,
  type ManagedStaffRecord,
} from '@/hooks/useUsers';
import { USER_ROLE_LABELS, type UserRole } from '@/types/user';

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];
const DEFAULT_STAFF_PASSWORD = 'FundiStaff@2026';

type UserFormValues = {
  name: string;
  email: string;
  phone: string;
  role: UserRole | '';
  password: string;
};

const createEmptyForm = (
  staff?: ManagedStaffRecord | null,
): UserFormValues => ({
  name: staff?.name ?? '',
  email: staff?.email ?? '',
  phone: staff?.phone ?? '',
  role: staff?.role ?? '',
  password: DEFAULT_STAFF_PASSWORD,
});

type Errors = Partial<Record<keyof UserFormValues, string>>;

function validate(input: UserFormValues, isEditing: boolean): Errors {
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
  if (!isEditing && (!input.password || input.password.trim().length < 6)) {
    errors.password = 'Default password must be at least 6 characters.';
  }

  return errors;
}

type CreatedAccountSummary = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export function UserFormDialog({
  open,
  onClose,
  staff,
}: {
  open: boolean;
  onClose: () => void;
  staff?: ManagedStaffRecord | null;
}) {
  const id = useId();
  const toast = useToast();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const isEditing = Boolean(staff);

  const [input, setInput] = useState<UserFormValues>(() =>
    createEmptyForm(staff),
  );
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdAccount, setCreatedAccount] =
    useState<CreatedAccountSummary | null>(null);

  useEffect(() => {
    if (!open) return;
    setInput(createEmptyForm(staff));
    setTouched(false);
    setShowPassword(false);
    setCopied(false);
    setCreatedAccount(null);
  }, [open, staff]);

  const set = <K extends keyof UserFormValues>(
    key: K,
    value: UserFormValues[K],
  ) => {
    setInput((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetDefaultPassword = () => {
    set('password', DEFAULT_STAFF_PASSWORD);
    toast('Default password restored', 'success');
  };

  const copyCredentials = async () => {
    if (!createdAccount) return;
    const text = `Email: ${createdAccount.email}\nDefault Password: ${createdAccount.password}\nChange Password URL: /admin/change-password`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast('Login credentials copied', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Could not copy automatically; please copy manually.', 'error');
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  const save = async () => {
    setTouched(true);
    const validationErrors = validate(input, isEditing);

    if (Object.keys(validationErrors).length > 0 || !input.role) {
      return;
    }

    const trimmedName = input.name.trim();
    const trimmedEmail = input.email.trim();
    const trimmedPhone = input.phone.trim();
    const passwordToUse = input.password.trim();
    const selectedRole = input.role;

    try {
      if (isEditing && staff) {
        await updateUser.mutateAsync({
          id: staff.id,
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          role: selectedRole,
          status: staff.status,
          createdAt: staff.createdAt,
        });
        toast(`${trimmedName} updated successfully`, 'success');
        onClose();
        return;
      }

      await createUser.mutateAsync({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        role: selectedRole,
        password: passwordToUse,
      });

      toast(`${trimmedName} added with default password`, 'success');
      setCreatedAccount({
        name: trimmedName,
        email: trimmedEmail,
        password: passwordToUse,
        role: selectedRole,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isEditing
            ? 'Could not update staff account'
            : 'Could not create staff account';
      toast(message, 'error');
    }
  };

  const errors = touched ? validate(input, isEditing) : {};

  if (createdAccount) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Staff account created"
        description="Share these initial sign-in details with the staff member. They can update their password after signing in."
        footer={
          <>
            <Button variant="secondary" onClick={copyCredentials}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy credentials
                </>
              )}
            </Button>
            <Button onClick={onClose}>Done</Button>
          </>
        }
      >
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <div>
            <span className="block text-xs font-medium text-slate-500">
              Staff Member
            </span>
            <span className="font-medium text-slate-900">
              {createdAccount.name} ({USER_ROLE_LABELS[createdAccount.role]})
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-500">
              Email Address
            </span>
            <span className="font-mono text-slate-900">
              {createdAccount.email}
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-500">
              Default Password
            </span>
            <span className="font-mono font-semibold text-slate-900">
              {createdAccount.password}
            </span>
          </div>
          <p className="pt-1 text-xs text-slate-500">
            Staff members can change their password anytime under{' '}
            <span className="font-medium text-slate-700">
              Change password
            </span>{' '}
            after logging in.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit staff member' : 'Add administrative staff'}
      description={
        isEditing
          ? 'Update the staff member phone number, contact details, or role.'
          : 'Create a new account for a Super Admin, Admin Support, or Accountant with a default password.'
      }
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            loading={isPending}
            disabled={isPending}
          >
            {isEditing ? 'Save changes' : 'Add staff member'}
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

        <Field
          label="Email Address"
          htmlFor={`${id}-email`}
          error={errors.email}
        >
          <Input
            id={`${id}-email`}
            type="email"
            value={input.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="e.g. jean@fundi.rw"
            invalid={Boolean(errors.email)}
          />
        </Field>

        <Field
          label="Phone Number"
          htmlFor={`${id}-phone`}
          error={errors.phone}
        >
          <Input
            id={`${id}-phone`}
            value={input.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="e.g. +250 788 000 000"
            invalid={Boolean(errors.phone)}
          />
        </Field>

        <Field
          label="Management Role"
          htmlFor={`${id}-role`}
          error={errors.role}
        >
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

        {!isEditing && (
          <Field
            label="Default Password"
            htmlFor={`${id}-password`}
            error={errors.password}
            hint="Staff can sign in with this password and update it later."
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id={`${id}-password`}
                  type={showPassword ? 'text' : 'password'}
                  value={input.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Default password"
                  invalid={Boolean(errors.password)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={resetDefaultPassword}
                title="Reset to default password"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Default
              </Button>
            </div>
          </Field>
        )}
      </form>
    </Modal>
  );
}
