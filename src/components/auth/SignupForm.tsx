'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { PasswordInput } from './PasswordInput';
import { authInputClass as inputClass } from './styles';

/**
 * Sign up UI only. Account creation is out of scope for now, so submitting shows a
 * confirmation; replace with the real registration call when the API exists.
 */
export function SignupForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold text-slate-900">You&apos;re all set!</h2>
        <p className="mt-1 text-sm text-slate-600">Download the Fundi app to request a repair or apply to work as a Fundi.</p>
        <Link
          href="/#download"
          className="mt-5 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Get the app
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div>
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Full name
        </label>
        <input id="name" name="name" type="text" autoComplete="name" required placeholder="Your name" className={inputClass} />
      </div>

      <div>
        <label htmlFor="phone" className="text-sm font-medium text-slate-700">
          Phone number
        </label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="Your phone number" className={inputClass} />
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className={inputClass} />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </div>

      <Button type="submit" className="w-full">
        Create account
      </Button>

      <p className="text-center text-xs text-slate-500">
        By creating an account you agree to Fundi&apos;s Terms of service and Privacy policy.
      </p>
    </form>
  );
}
