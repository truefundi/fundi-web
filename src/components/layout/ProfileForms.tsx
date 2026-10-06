'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { authInputClass as inputClass } from '@/components/auth/styles';
import { Button, Card, CardBody, CardHeader } from '@/components/ui';

function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
      <CheckCircle2 className="h-4 w-4" aria-hidden /> {children}
    </p>
  );
}

/** UI only: saving shows a confirmation; connect to the profile API when it exists. */
export function ProfileDetailsForm() {
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <CardHeader title="Personal information" description="Your name and contact details." />
      <CardBody>
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
          }}
          onChange={() => setSaved(false)}
        >
          <div>
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Full name
            </label>
            <input id="name" name="name" type="text" required defaultValue="Admin" className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input id="email" name="email" type="email" required defaultValue="admin@fundi.app" className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium text-slate-700">
              Phone number
            </label>
            <input id="phone" name="phone" type="tel" placeholder="Your phone number" className={inputClass} />
          </div>
          <div>
            <label htmlFor="role" className="text-sm font-medium text-slate-700">
              Role
            </label>
            <input id="role" type="text" value="Administrator" disabled className={`${inputClass} bg-slate-50 text-slate-500`} />
          </div>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
            <Button type="submit">Save changes</Button>
            {saved && <SuccessNote>Profile updated.</SuccessNote>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

/** UI only: checks the two new passwords match; connect to the API when it exists. */
export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <Card id="change-password" className="scroll-mt-24">
      <CardHeader title="Change password" description="Use at least 8 characters." />
      <CardBody>
        <form
          className="max-w-md space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            if (form.get('newPassword') !== form.get('confirmPassword')) {
              setError('The new passwords do not match.');
              setSaved(false);
              return;
            }
            setError(null);
            setSaved(true);
            e.currentTarget.reset();
          }}
        >
          <div>
            <label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
              Current password
            </label>
            <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" required />
          </div>
          <div>
            <label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
              New password
            </label>
            <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" required minLength={8} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Confirm new password
            </label>
            <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required minLength={8} />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit">Update password</Button>
            {saved && <SuccessNote>Password updated.</SuccessNote>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
