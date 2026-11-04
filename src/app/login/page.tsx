
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, requestDevOtp, isDevOtpEnabled } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/admin");
    }
  }, [isLoading, user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!isDevOtpEnabled) {
      setError(
        "Development OTP login is unavailable. Please use the configured production login flow."
      );
      return;
    }

    if (!email.trim()) {
      setError("Please enter your admin email.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await requestDevOtp(email.trim());

      if (result.ok) {
        router.push("/verify-2fa");
      } else {
        setError(result.error || "Unable to request OTP. Please try again.");
      }
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout logoSrc="/images/fundi.png">
      <h1 className="mt-4 text-center text-3xl font-bold tracking-tight text-slate-900">
        Fundi Admin Portal
      </h1>

      <p className="mt-2 text-center text-sm text-slate-600">
        Sign in to access the management console.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide"
          >
            Email
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fundi.rw"
              className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (not used in development OTP)"
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-slate-200 pl-3.5 pr-11 text-sm outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
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
          disabled={submitting || isLoading || !isDevOtpEnabled}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            "Requesting OTP..."
          ) : (
            <>
              Sign In <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
