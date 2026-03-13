/**
 * Jest setup file — runs before module loads (via setupFiles in jest.config.cjs).
 *
 * Sets PAYMENT_MANAGER_E2E_ADMIN_TOKEN so that env.ts skips strict validation
 * during tests. This follows the bypass designed in env.ts:
 *
 *   if (NODE_ENV === "test" && PAYMENT_MANAGER_E2E_ADMIN_TOKEN) → use .partial()
 *
 * The token value here is for test isolation only; it is not a real secret.
 */

// NODE_ENV is already "test" when Jest runs — set the E2E bypass token.
process.env.PAYMENT_MANAGER_E2E_ADMIN_TOKEN = "test-e2e-bypass-token-for-env-validation";
