export const ROLES = [
  "visitor",
  "customer",
  "plumber_applicant",
  "verified_plumber",
  "suspended_plumber",
  "support_agent",
  "admin",
  "super_admin",
] as const;

export type Role = (typeof ROLES)[number];

export const ADMIN_ROLES: Role[] = ["support_agent", "admin", "super_admin"];
export const STAFF_MONEY_ROLES: Role[] = ["admin", "super_admin"];
