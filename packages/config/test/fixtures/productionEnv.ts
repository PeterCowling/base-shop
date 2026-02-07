/**
 * Production Environment Test Fixtures
 *
 * Use these fixtures when writing tests that need to simulate production mode.
 * Production mode requires certain secrets and configuration values that are
 * optional in development/test modes.
 *
 * @example
 * ```typescript
 * import { PRODUCTION_BASE_ENV, PRODUCTION_SECRETS } from "@acme/config/test/fixtures/productionEnv";
 *
 * it("works in production", async () => {
 *   await withEnv(
 *     { NODE_ENV: "production", ...PRODUCTION_BASE_ENV },
 *     async () => { ... }
 *   );
 * });
 * ```
 */

/**
 * Minimum secrets required for production mode.
 * These are validated as strong secrets (32+ chars, printable ASCII).
 */
export const PRODUCTION_SECRETS = {
  NEXTAUTH_SECRET: "nextauth-secret-32-chars-long-string!",
  SESSION_SECRET: "session-secret-32-chars-long-string!",
  CART_COOKIE_SECRET: "cart-cookie-secret-value",
} as const;

/**
 * CMS configuration required for production mode.
 */
export const PRODUCTION_CMS_ENV = {
  CMS_SPACE_URL: "https://cms.example.com",
  CMS_ACCESS_TOKEN: "test-cms-token",
  SANITY_API_VERSION: "2021-10-21",
  SANITY_PROJECT_ID: "test-project",
  SANITY_DATASET: "production",
  SANITY_API_TOKEN: "test-sanity-token",
  SANITY_PREVIEW_SECRET: "test-preview-secret",
} as const;

/**
 * Complete base environment for production mode tests.
 * Combines secrets and CMS config - use this for most production tests.
 */
export const PRODUCTION_BASE_ENV = {
  ...PRODUCTION_SECRETS,
  ...PRODUCTION_CMS_ENV,
} as const;

/**
 * Auth-specific production environment with JWT configuration.
 */
export const PRODUCTION_AUTH_JWT_ENV = {
  ...PRODUCTION_BASE_ENV,
  AUTH_PROVIDER: "jwt",
  JWT_SECRET: "jwt-secret-32-chars-long-string-here!",
} as const;

/**
 * Auth-specific production environment with OAuth configuration.
 */
export const PRODUCTION_AUTH_OAUTH_ENV = {
  ...PRODUCTION_BASE_ENV,
  AUTH_PROVIDER: "oauth",
  OAUTH_ISSUER: "https://auth.example.com/realms/test",
  OAUTH_CLIENT_ID: "test-client-id",
  OAUTH_CLIENT_SECRET: "oauth-secret-32-chars-long-string!!",
  OAUTH_REDIRECT_ORIGIN: "https://shop.example.com",
} as const;

/**
 * Helper to create a production env with custom overrides.
 */
export function createProductionEnv(
  overrides: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  return {
    NODE_ENV: "production",
    ...PRODUCTION_BASE_ENV,
    ...overrides,
  };
}

/**
 * Keys that withEnv carries over from the real environment.
 * When testing "missing variable" scenarios, explicitly set these to undefined.
 *
 * @example
 * ```typescript
 * const cleanEnv = Object.fromEntries(
 *   CARRY_OVER_KEYS.map(k => [k, undefined])
 * );
 * await withEnv({ NODE_ENV: "development", ...cleanEnv }, ...);
 * ```
 */
export const CARRY_OVER_KEYS = [
  "SANITY_PROJECT_ID",
  "SANITY_DATASET",
  "SANITY_API_TOKEN",
  "SANITY_PREVIEW_SECRET",
] as const;

/**
 * Helper to create an env object that explicitly unsets carry-over keys.
 * Use when testing development defaults for missing variables.
 */
export function withoutCarryOverKeys(
  env: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const result = { ...env };
  for (const key of CARRY_OVER_KEYS) {
    if (!(key in result)) {
      result[key] = undefined;
    }
  }
  return result;
}
