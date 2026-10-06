'use client';

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { challengeStorage } from '@/lib/token-storage';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function Verify2FAPage() {
  const router = useRouter();
  const { user, verifyCode, resendCode } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (user) router.replace('/admin');
    else if (!challengeStorage.get()) router.replace('/login');
  }, [user, router]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id); 
  }, [secondsLeft]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1); 
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((char, i) => (next[i] = char));
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleVerify() {
    const code = digits.join('');
    if (code.length < CODE_LENGTH) {
      setError('Please enter the 6-digit code');
      return;
    }
    setError('');
    setSubmitting(true);
    const result = await verifyCode(code);
    setSubmitting(false);

    if (result.ok) router.replace('/admin');
    else {
      setError(result.error || 'Verification failed');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    }
  }

  async function handleResend() {
    if (secondsLeft > 0) return;
    const result = await resendCode();
    if (result.ok) {
      setSecondsLeft(RESEND_SECONDS);
      setError('');
    } else setError(result.error || 'Could not resend code');
  }

  function backToSignIn() {
    challengeStorage.clear();
    router.push('/login');
  }

  const timerLabel = `0:${String(secondsLeft).padStart(2, '0')}`;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/70">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-amber-600 shadow-sm">
          <ShieldCheck size={22} />
        </div>

        <h1 className="mt-8 text-center text-sm font-bold">Two-Factor Authentication</h1>
        <p className="mx-auto mt-2 max-w-xs text-center text-sm text-slate-700">
          Enter the 6-digit verification code sent to your administrative email.
        </p>

        <div className="mt-6 flex justify-between gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              autoFocus={i === 0}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              aria-label={`Digit ${i + 1}`}
              className="h-14 w-12 rounded-lg border border-slate-400 text-center text-xl font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={submitting}
          className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-3.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
        >
          {submitting ? 'Verifying…' : (<>Verify <ArrowRight size={16} /></>)}
        </button>

        <p className="mt-6 text-center text-sm">
          Didn&apos;t receive a code?{' '}
          <button
            onClick={handleResend}
            disabled={secondsLeft > 0}
            className="font-semibold text-amber-600 disabled:cursor-not-allowed"
          >
            Resend Code{secondsLeft > 0 && ` (${timerLabel})`}
          </button>
        </p>

        <button
          onClick={backToSignIn}
          className="mx-auto mt-4 flex items-center gap-1.5 text-sm text-slate-800"
        >
          <ArrowLeft size={14} /> Back to password sign in
        </button>
      </div>
    </main>
  );
}