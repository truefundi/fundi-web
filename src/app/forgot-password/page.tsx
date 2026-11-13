"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authService } from "@/lib/auth-service";

type ResetStep = "request" | "verify" | "password" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestCode() {
    setError("");
    setNotice("");
    setSubmitting(true);

    const result = await authService.requestPasswordReset(email.trim());
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    setStep("verify");
    setOtp("");
    setResetToken("");
    setNotice(
      "If an active admin account matches that email, a verification code has been sent to its registered phone.",
    );
  }

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestCode();
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit verification code.");
      return;
    }

    setSubmitting(true);
    const result = await authService.verifyPasswordResetOtp(email.trim(), otp);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    const verifiedResetToken = result.data?.resetToken;
    if (!verifiedResetToken) {
      setStep("request");
      setError(
        "Could not start the password reset. Please request a new code.",
      );
      return;
    }

    setResetToken(verifiedResetToken);
    setOtp("");
    setStep("password");
    setNotice("Code verified. You can now choose a new password.");
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!resetToken) {
      setError("Your verification has expired. Request a new code.");
      setStep("request");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (
      newPassword.length < 8 ||
      newPassword.length > 72 ||
      !/[A-Z]/.test(newPassword) ||
      !/\d/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      setError(
        "Use 8–72 characters with at least one uppercase letter, one number, and one symbol.",
      );
      return;
    }

    setSubmitting(true);
    const result = await authService.resetPassword(
      email.trim(),
      resetToken,
      newPassword,
    );
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("done");
  }

  return (
    <AuthLayout logoSrc="/images/fundi.png" scrollable>
      {step === "done" ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Password updated
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your password was reset and existing admin sessions were signed out.
          </p>
          <Link
            href="/login"
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Return to sign in <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <h1 className="mt-4 text-center text-3xl font-bold tracking-tight text-slate-900">
            Reset admin password
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            {step === "request"
              ? "We’ll send a verification code to the phone registered to your admin account."
              : step === "verify"
                ? "Enter the code sent to your registered phone. You’ll choose a new password after it is verified."
                : "Your verification code is confirmed. Choose a new password for your admin account."}
          </p>

          {step === "request" ? (
            <form onSubmit={handleRequestCode} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                >
                  Admin email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@fundi.rw"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending code..." : "Send verification code"}
                {!submitting && <ArrowRight size={16} />}
              </button>
            </form>
          ) : step === "verify" ? (
            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
              {notice && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {notice}
                </p>
              )}
              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                >
                  Verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6-digit code"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm tracking-widest outline-none placeholder:tracking-normal placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Verifying code..." : "Verify code"}
                {!submitting && <ArrowRight size={16} />}
              </button>
              <button
                type="button"
                onClick={requestCode}
                disabled={submitting}
                className="w-full text-sm font-medium text-amber-700 hover:text-amber-800 disabled:opacity-60"
              >
                Resend verification code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setError("");
                  setNotice("");
                }}
                disabled={submitting}
                className="w-full text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-60"
              >
                Use a different email
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
              {notice && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {notice}
                </p>
              )}
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  At least 8 characters, including an uppercase letter, a
                  number, and a symbol.
                </p>
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Updating password..." : "Reset password"}
                {!submitting && <ArrowRight size={16} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setResetToken("");
                  setError("");
                  setNotice("");
                }}
                disabled={submitting}
                className="w-full text-sm font-medium text-amber-700 hover:text-amber-800 disabled:opacity-60"
              >
                Request a new verification code
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 hover:text-amber-700"
          >
            <ArrowLeft size={15} /> Back to sign in
          </Link>
        </>
      )}
    </AuthLayout>
  );
}
