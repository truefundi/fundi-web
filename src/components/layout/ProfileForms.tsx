'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/lib/auth-service';
import { api, unwrap } from '@/lib/api/client';
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

/** Saves identity fields through the administrator user endpoint. */
export function ProfileDetailsForm() {
  const { user, reloadUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <Card>
      <CardHeader title="Personal information" description="Your name and contact details." />
      <CardBody>
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!user) return;
            const form = new FormData(e.currentTarget);
            setPending(true); setSaved(false); setError(null);
            try {
              await unwrap(api.patch(`/users/${user.id}`, {
                fullName: String(form.get('name')).trim(),
                email: String(form.get('email')).trim(),
                ...(form.get('phone') ? { phoneNumber: String(form.get('phone')).trim() } : {}),
              }));
              await reloadUser();
              setSaved(true);
            } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update profile.'); }
            finally { setPending(false); }
          }}
          onChange={() => setSaved(false)}
        >
          <div>
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Full name
            </label>
            <input id="name" name="name" type="text" required key={user?.fullName} defaultValue={user?.fullName ?? ''} className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input id="email" name="email" type="email" required key={user?.email} defaultValue={user?.email ?? ''} className={inputClass} />
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
            <Button type="submit" disabled={pending}>Save changes</Button>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {saved && <SuccessNote>Profile updated.</SuccessNote>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

/** Changing the password revokes sessions and requires signing in again. */
export function ChangePasswordForm() {
  const { logout } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <Card id="change-password" className="scroll-mt-24">
      <CardHeader title="Change password" description="Use 8–72 characters with an uppercase letter, a number, and a symbol. You will need to sign in again." />
      <CardBody>
        <form
          className="max-w-md space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            if (form.get('newPassword') !== form.get('confirmPassword')) {
              setError('The new passwords do not match.');
              setSaved(false);
              return;
            }
            setError(null); setSaved(false); setPending(true);
            const result = await authService.changePassword(String(form.get('currentPassword')), String(form.get('newPassword')));
            setPending(false);
            if (result.error) { setError(result.error); return; }
            logout();
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
            <Button type="submit" disabled={pending}>Update password</Button>
            {saved && <SuccessNote>Password updated.</SuccessNote>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
