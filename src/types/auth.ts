export interface AdminUser {
  id: string;

  email: string;

  password: string;
}

export interface LoginResponse {
  require2FA: boolean;

  challengeToken: string;
}

export interface VerifyResponse {
  accessToken: string;
  user: AdminUser;
}
