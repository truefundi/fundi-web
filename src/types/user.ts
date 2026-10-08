import type { AccountStatus } from "./customer";

export const USER_ROLES = ["CUSTOMER", "TECHNICIAN", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
}
