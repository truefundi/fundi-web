
export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN';
}

export interface LoginResponse {
  enrollmentRequired: boolean;
  otpauthUri?: string;
  secret?: string;
  expiresInSeconds: number;
  message: string;
}

export interface VerifyResponse {
  user: AdminUser;
  expiresInSeconds: number;
}
