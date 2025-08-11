// packages/auth/src/index.ts

export { canRead, canWrite, READ_ROLES, WRITE_ROLES } from "./rbac";
export { extendRoles, isRole } from "./types/roles";
export type { Role } from "./types";
export {
  CUSTOMER_SESSION_COOKIE,
  CSRF_TOKEN_COOKIE,
  getCustomerSession,
  createCustomerSession,
  destroyCustomerSession,
  listSessions,
  revokeSession,
  validateCsrfToken,
} from "./session";
export type { CustomerSession } from "./session";

export {
  enrollMfa,
  verifyMfa,
  isMfaEnabled,
} from "./mfa";
