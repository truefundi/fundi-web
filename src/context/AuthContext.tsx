
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth-service';
import { setUnauthorizedHandler } from '@/lib/api-client';
import type { AdminUser } from '@/types/auth';

interface ActionResult {
  ok: boolean;
  error?: string;
  otp?: string;
}

interface AuthenticatorSetup {
  otpauthUri: string;
  secret: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  authenticatorSetup: AuthenticatorSetup | null;
  devOtpEmail: string | null;
  devOtp: string | null;
  isDevOtpEnabled: boolean;
  login: (email: string, password: string) => Promise<ActionResult>;
  requestDevOtp: (email: string) => Promise<ActionResult>;
  verifyDevOtp: (otp: string) => Promise<ActionResult>;
  verifyCode: (code: string) => Promise<ActionResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const isDevOtpEnabled = process.env.NODE_ENV === 'development';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticatorSetup, setAuthenticatorSetup] =
    useState<AuthenticatorSetup | null>(null);

  const [devOtpEmail, setDevOtpEmail] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const logout = useCallback(() => {
    void authService.logout();

    setUser(null);
    setAuthenticatorSetup(null);
    setDevOtpEmail(null);
    setDevOtp(null);

    router.replace('/login');
  }, [router]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const { data } = await authService.me();

        if (active && data) {
          setUser(data);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setAuthenticatorSetup(null);
      setDevOtpEmail(null);
      setDevOtp(null);
      router.replace('/login');
    };

    setUnauthorizedHandler(handleUnauthorized);

    return () => setUnauthorizedHandler(() => undefined);
  }, [router]);

  const login = async (
    email: string,
    password: string,
  ): Promise<ActionResult> => {
    const { data, error } = await authService.login(email, password);

    if (error || !data) {
      return {
        ok: false,
        error: error || 'Unable to sign in. Please try again.',
      };
    }

    setDevOtpEmail(null);
    setDevOtp(null);

    if (data.enrollmentRequired) {
      if (!data.otpauthUri || !data.secret) {
        return {
          ok: false,
          error: 'Authenticator setup information was not returned by the server.',
        };
      }

      setAuthenticatorSetup({
        otpauthUri: data.otpauthUri,
        secret: data.secret,
      });
    } else {
      setAuthenticatorSetup(null);
    }

    return { ok: true };
  };

  const requestDevOtp = async (email: string): Promise<ActionResult> => {
    if (!isDevOtpEnabled) {
      return {
        ok: false,
        error: 'Development OTP login is not available.',
      };
    }

    const { data, error } = await authService.requestDevOtp(email);

    if (error || !data) {
      return {
        ok: false,
        error: error || 'Unable to request development OTP.',
      };
    }

    setAuthenticatorSetup(null);
    setDevOtpEmail(email);
    setDevOtp(data.otp);

    return {
      ok: true,
      otp: data.otp,
    };
  };

  const verifyDevOtp = async (otp: string): Promise<ActionResult> => {
    if (!isDevOtpEnabled || !devOtpEmail) {
      return {
        ok: false,
        error: 'Development OTP login session was not found.',
      };
    }

    const { data, error } = await authService.verifyDevOtp(
      devOtpEmail,
      otp,
    );

    if (error || !data) {
      return {
        ok: false,
        error: error || 'Development OTP verification failed.',
      };
    }

    setUser(data.user);
    setAuthenticatorSetup(null);
    setDevOtpEmail(null);
    setDevOtp(null);

    return { ok: true };
  };

  const verifyCode = async (code: string): Promise<ActionResult> => {
    const { data, error } = await authService.verify2FA(code);

    if (error || !data) {
      return {
        ok: false,
        error: error || 'Verification failed. Please try again.',
      };
    }

    setUser(data.user);
    setAuthenticatorSetup(null);

    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authenticatorSetup,
        devOtpEmail,
        devOtp,
        isDevOtpEnabled,
        login,
        requestDevOtp,
        verifyDevOtp,
        verifyCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }

  return ctx;
}
