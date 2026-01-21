/**
 * Phase 1: Environment Setup
 *
 * Executed first to configure the test environment before any code runs.
 * - Loads environment variables via dotenv (if not already loaded)
 * - Sets test-specific environment variables
 * - Configures Browserslist to avoid staleness warnings
 *
 * IMPORTANT: Keep this file minimal. It runs before Jest's test environment
 * is fully initialized, so avoid imports that require the DOM or global mocks.
 */

// Silence Browserslist staleness warnings during tests
process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";
process.env.BROWSERSLIST_DISABLE_CACHE = "1";

/**
 * TypeScript 5.1+ with @types/node ≥ 22 marks all `process.env` keys as
 * readonly, breaking direct assignment. Work around this by casting to
 * a mutable record.
 */
const internalEnv = process.env;
const mutableEnv = internalEnv as unknown as Record<string, string>;

/**
 * Make process.env re-assignable for tests that need to swap environments.
 * When setting a new env object, copy all properties and ensure EMAIL_FROM
 * is always defined.
 */
Object.defineProperty(process, "env", {
  configurable: true,
  get() {
    return internalEnv;
  },
  set(nextEnv: NodeJS.ProcessEnv) {
    if (nextEnv && nextEnv !== internalEnv) {
      // Clear existing keys
      for (const key of Object.keys(internalEnv)) {
        delete internalEnv[key];
      }
      // Copy new keys
      for (const [key, value] of Object.entries(nextEnv)) {
        if (typeof value !== "undefined") {
          internalEnv[key] = value;
        }
      }
    }
    // Ensure EMAIL_FROM is always set
    if (!nextEnv || !Object.prototype.hasOwnProperty.call(nextEnv, "EMAIL_FROM")) {
      if (typeof internalEnv.EMAIL_FROM !== "string") {
        internalEnv.EMAIL_FROM = "test@example.com";
      }
    }
  },
});

/**
 * Set default test environment variables.
 * Use ||= to preserve values from CI or .env files when present.
 */
mutableEnv.NODE_ENV ||= "development"; // Relax edge runtime checks
mutableEnv.CART_COOKIE_SECRET ||= "test-cart-secret"; // Cart cookie signing
mutableEnv.STRIPE_WEBHOOK_SECRET ||= "whsec_test"; // Dummy Stripe webhook secret
mutableEnv.EMAIL_FROM ||= "test@example.com"; // Dummy sender email
mutableEnv.CMS_SPACE_URL ||= "https://cms.example.com";
mutableEnv.CMS_ACCESS_TOKEN ||= "cms-access-token";
mutableEnv.SANITY_API_VERSION ||= "2023-01-01";
mutableEnv.AUTH_TOKEN_TTL ||= "15m";
mutableEnv.EMAIL_PROVIDER ||= "smtp";
mutableEnv.STRIPE_USE_MOCK ||= "true"; // Use Stripe mock by default

/**
 * Ensure auth secrets are at least 32 characters long.
 * Jest loads dotenv via setupFiles before this script runs, so existing but
 * too-short values need to be replaced (||= won't work here).
 */
const ensureSecret = (key: string, fallback: string) => {
  const current = process.env[key];
  if (!current || current.length < 32) {
    mutableEnv[key] = fallback;
  }
};

ensureSecret(
  "NEXTAUTH_SECRET",
  "test-nextauth-secret-32-chars-long-string!",
);
ensureSecret(
  "SESSION_SECRET",
  "test-session-secret-32-chars-long-string!",
);
