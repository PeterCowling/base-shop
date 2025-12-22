// packages/auth/src/index.ts

export { canRead, canWrite, READ_ROLES, WRITE_ROLES } from "./rbac";
export { extendRoles, isRole } from "./types/roles";
export { hasPermission } from "./permissions";
export { requirePermission } from "./requirePermission";
export type { Role, Permission } from "./types/index";
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
export type { SessionStore, SessionRecord } from "./store";
export { setSessionStoreFactory } from "./store";
export {
  beginOidcLogin,
  completeOidcLogin,
  buildOidcLogoutUrl,
} from "./oidc";
export type { OidcProfile } from "./oidc";

export {
  enrollMfa,
  verifyMfa,
  isMfaEnabled,
  generateMfaToken,
  verifyMfaToken,
} from "./mfa";
