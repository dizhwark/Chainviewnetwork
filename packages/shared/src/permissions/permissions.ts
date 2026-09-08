import { Role } from "./roles";

/**
 * Action -> roles allowed to perform it, mirroring docs/permissions-matrix.md.
 * This is the FRONTEND convenience layer only (used to hide/show controls).
 * The backend re-derives and enforces the same rules independently in
 * apps/api guards plus object-level ownership checks — never trust this
 * module alone for authorization decisions.
 */
export const ACTION_ROLES = {
  submit_service_request: ["visitor", "customer"],
  view_own_bookings: ["customer", "support_agent", "admin", "super_admin"],
  accept_job_offer: ["verified_plumber", "admin", "super_admin"],
  create_estimate: ["verified_plumber", "admin", "super_admin"],
  approve_estimate: ["customer", "admin", "super_admin"],
  leave_review: ["customer"],
  respond_to_review: ["verified_plumber", "admin", "super_admin"],
  open_dispute: ["customer", "verified_plumber", "support_agent", "admin", "super_admin"],
  approve_plumber_application: ["admin", "super_admin"],
  suspend_user: ["admin", "super_admin"],
  assign_plumber: ["admin", "super_admin"],
  issue_refund: ["admin", "super_admin"],
  configure_platform_settings: ["admin", "super_admin"],
  manage_admin_accounts: ["super_admin"],
  read_audit_log: ["support_agent", "admin", "super_admin"],
} as const satisfies Record<string, Role[]>;

export type Action = keyof typeof ACTION_ROLES;

export function roleCan(role: Role, action: Action): boolean {
  return (ACTION_ROLES[action] as readonly Role[]).includes(role);
}
