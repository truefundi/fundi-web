export const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] as const;
export const USER_ROLES = [
  "CUSTOMER",
  "TECHNICIAN",
  "SUPER_ADMIN",
  "ADMIN",
  "ACCOUNTANT",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  CUSTOMER: "Customer",
  TECHNICIAN: "Technician",
};

export type Permission =
  | "manage:staff"
  | "view:audit_logs"
  | "manage:requests"
  | "manage:customers"
  | "manage:technicians"
  | "view:jobs"
  | "manage:categories"
  | "manage:finance";

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  SUPER_ADMIN: [
    "manage:staff",
    "view:audit_logs",
    "manage:requests",
    "manage:customers",
    "manage:technicians",
    "view:jobs",
    "manage:categories",
    "manage:finance",
  ],
  ADMIN: [
    "manage:requests",
    "manage:customers",
    "manage:technicians",
    "view:jobs",
    "manage:categories",
  ],
  ACCOUNTANT: [
    "manage:finance",
    "view:jobs", // Needed to reconcile booking fees & technician payouts
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role || !(role in ROLE_PERMISSIONS)) return false;
  return ROLE_PERMISSIONS[role as StaffRole].includes(permission);
}