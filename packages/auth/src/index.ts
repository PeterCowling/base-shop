// packages/auth/src/index.ts

export {
  deactivateMfa,
  enrollMfa,
  generateMfaToken,
  isMfaEnabled,
  verifyMfa,
  verifyMfaToken,
} from "./mfa";
export type { OidcProfile } from "./oidc";
export {
  beginOidcLogin,
  buildOidcLogoutUrl,
  completeOidcLogin,
} from "./oidc";
export { hasPermission } from "./permissions";
export { canRead, canWrite, READ_ROLES, WRITE_ROLES } from "./rbac";
export { requirePermission } from "./requirePermission";
export type { CustomerSession } from "./session";
export {
  createCustomerSession,
  CSRF_TOKEN_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  destroyCustomerSession,
  getCustomerSession,
  listSessions,
  revokeSession,
  validateCsrfToken,
} from "./session";
export type { SessionRecord,SessionStore } from "./store";
export { setSessionStoreFactory } from "./store";
export type { Permission,Role } from "./types/index";
export { extendRoles, isRole } from "./types/roles";
