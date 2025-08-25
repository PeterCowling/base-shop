// packages/auth/src/index.ts

export { canRead, canWrite, READ_ROLES, WRITE_ROLES } from "./rbac.ts";
export { extendRoles, isRole } from "./types/roles.ts";
export { hasPermission } from "./permissions.ts";
export { requirePermission } from "./requirePermission.ts";
export type { Role, Permission } from "./types/index.ts";
export {
  CUSTOMER_SESSION_COOKIE,
  CSRF_TOKEN_COOKIE,
  getCustomerSession,
  createCustomerSession,
  destroyCustomerSession,
  listSessions,
  revokeSession,
  validateCsrfToken,
} from "./session.ts";
export type { CustomerSession } from "./session.ts";
export type { SessionStore, SessionRecord } from "./store.ts";
export { setSessionStoreFactory } from "./store.ts";

export {
  enrollMfa,
  verifyMfa,
  isMfaEnabled,
} from "./mfa.ts";
