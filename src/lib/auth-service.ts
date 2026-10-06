import { fetchApi } from "./api-client";
import type { AdminUser, LoginResponse, VerifyResponse } from "../types/auth";

export const authService = {
  login: (email: string, password: string) =>
    fetchApi<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  verify2FA: (challengeToken: string, code: string) =>
    fetchApi<VerifyResponse>("/auth/verify-2fa", {
      method: "POST",
      body: JSON.stringify({ challengeToken, code }),
    }),
  resend2FA: (challengeToken: string) =>
    fetchApi<{ message: string }>("/auth/resend-2fa", {
      method: "POST",
      body: JSON.stringify({ challengeToken }),
    }),

  me: () => fetchApi<AdminUser>("/auth/me"),
};
