import { fetchApi } from "./api-client";
import type { AdminUser, LoginResponse, VerifyResponse } from "@/types/auth";

export interface DevOtpResponse {
  message: string;
  otp: string;
  expiresInSeconds: number;
}

export const authService = {
  login: (email: string, password: string) =>
    fetchApi<LoginResponse>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  requestPasswordReset: (email: string) =>
    fetchApi<{ message: string }>("/auth/admin/password/reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyPasswordResetOtp: (email: string, otp: string) =>
    fetchApi<{ resetToken: string; expiresInSeconds: number }>(
      "/auth/admin/password/reset/verify",
      {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      },
    ),

  resetPassword: (email: string, resetToken: string, newPassword: string) =>
    fetchApi<{ message: string; sessionsRevoked: boolean }>(
      "/auth/admin/password/reset",
      {
        method: "POST",
        body: JSON.stringify({ email, resetToken, newPassword }),
      },
    ),

  verify2FA: (code: string) =>
    fetchApi<VerifyResponse>("/auth/admin/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  requestDevOtp: (email: string) =>
    fetchApi<DevOtpResponse>("/auth/admin/dev/otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyDevOtp: (email: string, otp: string) =>
    fetchApi<VerifyResponse>("/auth/admin/dev/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    fetchApi<{ message: string; sessionsRevoked: boolean }>(
      "/auth/admin/change-password",
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
    ),

  me: () => fetchApi<AdminUser>("/auth/admin/me"),

  refresh: () =>
    fetchApi<VerifyResponse>("/auth/admin/refresh", {
      method: "POST",
    }),

  logout: () =>
    fetchApi<{ message: string }>("/auth/admin/logout", {
      method: "POST",
    }),
};
