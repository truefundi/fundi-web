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
import { tokenStorage, challengeStorage } from '@/lib/token-storage';
import type { AdminUser } from '@/types/auth';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean; 
  login: (email: string, password: string) => Promise<ActionResult>;
  verifyCode: (code: string) => Promise<ActionResult>;
  resendCode: () => Promise<ActionResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.clear();
    challengeStorage.clear();
    setUser(null);
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    async function restoreSession() {
      if (!tokenStorage.get()) {
        setIsLoading(false);
        return;
      }
      const { data } = await authService.me();
      if (data) setUser(data);
      else tokenStorage.clear();
      setIsLoading(false);
    }
    restoreSession();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      tokenStorage.clear();
      setUser(null);
      router.replace('/login');
    };

    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(() => undefined);
  }, [router]);

  const login = async (email: string, password: string): Promise<ActionResult> => {
    const { data, error } = await authService.login(email, password);
    if (error || !data) return { ok: false, error };
    challengeStorage.set(data.challengeToken);
    return { ok: true };
  };

  const verifyCode = async (code: string): Promise<ActionResult> => {
    const challenge = challengeStorage.get();
    if (!challenge) return { ok: false, error: 'Session expired, please sign in again' };

    const { data, error } = await authService.verify2FA(challenge, code);
    if (error || !data) return { ok: false, error };

    tokenStorage.set(data.accessToken);
    challengeStorage.clear();
    setUser(data.user);
    return { ok: true };
  };

  const resendCode = async (): Promise<ActionResult> => {
    const challenge = challengeStorage.get();
    if (!challenge) return { ok: false, error: 'Session expired, please sign in again' };
    const { error } = await authService.resend2FA(challenge);
    return error ? { ok: false, error } : { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, verifyCode, resendCode, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}