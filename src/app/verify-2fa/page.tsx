
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";

const CODE_LENGTH = 6;

export default function Verify2FAPage() {
  const router = useRouter();

  const {
    user,
    verifyCode,
    verifyDevOtp,
    authenticatorSetup,
    devOtpEmail,
    devOtp,
  } = useAuth();

  const [digits, setDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill("")
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const isDevelopmentLogin = Boolean(devOtpEmail);
  const verificationLock = useRef(false);

  useEffect(() => {
    if (user) {
      router.replace("/admin");
      return;
    }

    if (!authenticatorSetup && !devOtpEmail) {
      router.replace("/login");
    }
  }, [user, authenticatorSetup, devOtpEmail, router]);

  function handleChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    const next = [...digits];

    if (cleaned.length > 1) {
      const pastedDigits = cleaned.slice(0, CODE_LENGTH);

      pastedDigits.split("").forEach((digit, position) => {
        next[position] = digit;
      });

      setDigits(next);
      inputsRef.current[
        Math.min(pastedDigits.length, CODE_LENGTH - 1)
      ]?.focus();
      return;
    }

    next[index] = cleaned;
    setDigits(next);

    if (cleaned && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);

    if (!pasted) return;

    const next = Array(CODE_LENGTH).fill("");

    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });

    setDigits(next);

    inputsRef.current[
      Math.min(pasted.length, CODE_LENGTH - 1)
    ]?.focus();
  }

  
async function handleVerify() {
  // Prevent duplicate requests, even before React updates the UI.
  if (verificationLock.current) return;

  const code = digits.join("");

  if (code.length !== CODE_LENGTH) {
    setError("Please enter all 6 digits of your verification code.");
    return;
  }

  verificationLock.current = true;
  setError("");
  setSubmitting(true);

  try {
    const result = isDevelopmentLogin
      ? await verifyDevOtp(code)
      : await verifyCode(code);

    if (result.ok) {
      router.replace("/admin");
      return;
    }

    setError(result.error || "Verification failed. Please try again.");
    setDigits(Array(CODE_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
  } catch {
    setError("Unable to verify your code. Please try again.");
    setDigits(Array(CODE_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
  } finally {
    verificationLock.current = false;
    setSubmitting(false);
  }
}


  function backToSignIn() {
    router.push("/login");
  }

  return (
    <AuthLayout logoSrc="/images/fundi.png">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <ShieldCheck size={22} />
      </div>

<h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
  Verify Your Login
</h1>
      {isDevelopmentLogin ? (
        <div className="mx-auto mt-3 max-w-sm text-center">
          <p className="text-sm text-slate-600">
            Enter the six-digit development verification code for:
          </p>

          <p className="mt-2 font-semibold text-slate-900">
            {devOtpEmail}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            During development, the code is provided by the backend.
            It expires after five minutes.
          </p>

          {/* Temporary OTP display for local development only */}
          {devOtp && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-800">
                Your development OTP
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-amber-900">
                {devOtp}
              </p>
            </div>
          )}
        </div>
      ) : authenticatorSetup ? (
        <div className="mt-5 space-y-4 text-center">
          <p className="text-sm text-slate-600">
            Scan this QR code using Google Authenticator, Microsoft
            Authenticator, or another compatible authenticator app.
          </p>

          <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-4">
            <QRCodeSVG
              value={authenticatorSetup.otpauthUri}
              size={180}
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-left">
            <p className="text-xs font-semibold text-slate-600">
              Manual setup key
            </p>
            <p className="mt-1 break-all font-mono text-sm text-slate-900">
              {authenticatorSetup.secret}
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Keep your setup key private. Enter the six-digit code
            generated by your authenticator app below.
          </p>
        </div>
      ) : (
        <p className="mx-auto mt-3 max-w-xs text-center text-sm text-slate-600">
          Open your authenticator app and enter the current six-digit code.
        </p>
      )}

      <div className="mt-6 flex justify-between gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputsRef.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Verification digit ${index + 1}`}
            className="h-14 w-12 rounded-lg border border-slate-300 text-center text-xl font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleVerify}
        disabled={submitting || digits.join("").length !== CODE_LENGTH}
        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          "Verifying..."
        ) : (
          <>
            Verify <ArrowRight size={16} />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={backToSignIn}
        className="mx-auto mt-5 flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </button>
    </AuthLayout>
  );
}
