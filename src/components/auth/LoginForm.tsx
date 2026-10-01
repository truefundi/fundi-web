'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { PasswordInput } from './PasswordInput';
import { authInputClass as inputClass } from './styles';

/**
 * Login UI only. Authentication is out of scope for now, so submitting simply
 * opens the admin portal; replace with the real sign-in call when the API exists.
 */
export function LoginForm() {
  const router = useRouter();

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        router.push('/admin');
      }}
    >
      <div>
        <label htmlFor="identifier" className="text-sm font-medium text-slate-700">
          Email or phone number
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <span className="text-sm font-medium text-brand-600">Forgot password?</span>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="••••••••" />
      </div>

      <Button type="submit" className="w-full">
        Log in
      </Button>
    </form>
  );
}
