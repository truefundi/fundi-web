'use client';

import { useEffect, useState } from 'react';
import { Percent, User, Lock, Moon, Sun } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, useToast } from '@/components/ui';
import {
  DEFAULT_COMMISSION_RATE_PERCENT,
  useCommissionSettings,
} from '@/context/CommissionSettingsContext';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/lib/auth-service';
import { api, unwrap } from '@/lib/api/client';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useTheme } from '@/context/ThemeContext';

export function SettingsView() {
  const toast = useToast();
  const { commissionRatePercent, isLoaded, storageError, setCommissionRatePercent } = useCommissionSettings();
  const { user, reloadUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [value, setValue] = useState(String(DEFAULT_COMMISSION_RATE_PERCENT));
  const [error, setError] = useState('');

  // Profile form state
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profilePending, setProfilePending] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordPending, setPasswordPending] = useState(false);

  useEffect(() => {
    if (isLoaded) setValue(String(commissionRatePercent));
  }, [commissionRatePercent, isLoaded]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  function saveCommission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rate = Number(value);
    if (value.trim() === '' || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      setError('Enter a commission rate from 0% to 100%.');
      return;
    }

    try {
      setCommissionRatePercent(rate);
      setError('');
      toast('Commission rate saved in this browser.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not save the commission rate.';
      setError(message);
      toast(message, 'error');
    }
  }

  function resetCommission() {
    try {
      setCommissionRatePercent(DEFAULT_COMMISSION_RATE_PERCENT);
      setValue(String(DEFAULT_COMMISSION_RATE_PERCENT));
      setError('');
      toast('Commission rate reset to 30%.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not reset the commission rate.';
      setError(message);
      toast(message, 'error');
    }
  }

  async function handleUpdateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setProfilePending(true);
    try {
      await unwrap(api.patch(`/users/${user.id}`, {
        fullName: fullName.trim(),
        email: email.trim(),
      }));
      await reloadUser();
      toast('Account details updated successfully.');
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'Could not update profile.', 'error');
    } finally {
      setProfilePending(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordError('');
    setPasswordPending(true);
    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      if (result.error) {
        setPasswordError(result.error);
        toast(result.error, 'error');
        return;
      }
      toast('Password updated successfully. Please sign in again.');
      setTimeout(() => window.location.href = '/login', 1500);
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : 'Could not change password.';
      setPasswordError(msg);
      toast(msg, 'error');
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage business rules, user account, security, and theme preferences." />

      <div className="space-y-6 max-w-3xl">
        {/* Commission Rate Card */}
        <Card>
          <CardHeader
            title="Commission rate"
            description="Set Fundi’s share of the visit fee. The remainder goes to the technician."
            action={
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Percent className="h-5 w-5" aria-hidden />
              </span>
            }
          />
          <CardBody>
            <form onSubmit={saveCommission} className="space-y-5">
              <Field
                label="Fundi commission (%)"
                htmlFor="commission-rate"
                hint="Enter a value from 0 to 100. Decimals are supported."
                error={error || storageError || undefined}
              >
                <Input
                  id="commission-rate"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value);
                    setError('');
                  }}
                  disabled={!isLoaded}
                  invalid={Boolean(error || storageError)}
                  required
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={!isLoaded}>
                  Save commission rate
                </Button>
                <Button type="button" variant="secondary" onClick={resetCommission} disabled={!isLoaded}>
                  Reset to 30%
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* User Account & Profile Update Card */}
        <Card>
          <CardHeader
            title="User account"
            description="Update your administrator name and email address."
            action={
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <User className="h-5 w-5" aria-hidden />
              </span>
            }
          />
          <CardBody>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <Field label="Full Name" htmlFor="settings-name">
                <Input
                  id="settings-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>
              <Field label="Email Address" htmlFor="settings-email">
                <Input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Button type="submit" loading={profilePending}>
                Update account
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader
            title="Change password"
            description="Update your password securely using your current password."
            action={
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Lock className="h-5 w-5" aria-hidden />
              </span>
            }
          />
          <CardBody>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <Field label="Current Password" htmlFor="settings-current-password">
                <PasswordInput
                  id="settings-current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </Field>
              <Field label="New Password" htmlFor="settings-new-password">
                <PasswordInput
                  id="settings-new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </Field>
              <Field label="Confirm New Password" htmlFor="settings-confirm-password">
                <PasswordInput
                  id="settings-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </Field>
              {passwordError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {passwordError}
                </p>
              )}
              <Button type="submit" loading={passwordPending}>
                Change password
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Theme Preferences Card */}
        <Card>
          <CardHeader
            title="Theme preference"
            description="Switch between light and dark mode for the admin dashboard."
            action={
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                {theme === 'dark' ? <Moon className="h-5 w-5" aria-hidden /> : <Sun className="h-5 w-5" aria-hidden />}
              </span>
            }
          />
          <CardBody>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={theme === 'light' ? 'primary' : 'secondary'}
                onClick={() => setTheme('light')}
              >
                Light mode
              </Button>
              <Button
                type="button"
                variant={theme === 'dark' ? 'primary' : 'secondary'}
                onClick={() => setTheme('dark')}
              >
                Dark mode
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

