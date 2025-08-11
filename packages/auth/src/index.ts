// packages/auth/src/index.ts

export { canRead, canWrite, READ_ROLES, WRITE_ROLES } from "./rbac";
export { extendRoles, isRole } from "./types/roles";
export type { Role } from "./types";
export {
  CUSTOMER_SESSION_COOKIE,
  getCustomerSession,
  createCustomerSession,
  destroyCustomerSession,
  listCustomerSessions,
  revokeSession,
} from "./session";
export type { CustomerSession, ActiveSession } from "./session";
export {
  generateMfaSecret,
  verifyMfaToken,
  isMfaEnabled,
  disableMfa,
} from "./mfa";
