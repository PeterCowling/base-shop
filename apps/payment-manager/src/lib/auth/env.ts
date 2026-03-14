/**
 * Environment variable validation for payment-manager.
 *
 * Validates required vars at module load time so misconfiguration is caught
 * immediately on startup rather than at runtime during a request.
 *
 * Import this module in any file that needs these env vars to ensure early
 * validation. session.ts imports it so it always runs before auth is attempted.
 */

import { z } from "zod";

const envSchema = z.object({
  /** HMAC secret used to sign session tokens. Must be at least 32 chars. */
  PAYMENT_MANAGER_SESSION_SECRET: z.string().min(32, {
    message: "PAYMENT_MANAGER_SESSION_SECRET must be at least 32 characters", // i18n-exempt -- PM-0001 server validation error, not UI copy [ttl=2027-12-31]
  }),
  /** Bearer token accepted for admin API access. Must be at least 32 chars. */
  PAYMENT_MANAGER_ADMIN_TOKEN: z.string().min(32, {
    message: "PAYMENT_MANAGER_ADMIN_TOKEN must be at least 32 characters", // i18n-exempt -- PM-0001 server validation error, not UI copy [ttl=2027-12-31]
  }),
  /** Optional: comma-separated list of allowed client IP addresses. */
  PAYMENT_MANAGER_ALLOWED_IPS: z.string().optional(),
  /** Optional: database connection URL. */
  DATABASE_URL: z.string().optional(),
  /** AES-256-GCM key for encrypting provider credentials (base64, 32 bytes decoded). */
  PAYMENT_MANAGER_ENCRYPTION_KEY: z.string().min(44, {
    message: "PAYMENT_MANAGER_ENCRYPTION_KEY must be at least 44 chars (32 bytes base64)",
  }).optional(),
  /** Internal token used by payment-manager to call Caryina's internal routes. */
  CARYINA_INTERNAL_TOKEN: z.string().optional(),
  /** Token that Caryina uses when calling PM's /api/refunds route (Phase 2). */
  CARYINA_PM_TOKEN: z.string().optional(),
  /** Internal token used by other trusted services to call payment-manager APIs. */
  PAYMENT_MANAGER_INTERNAL_TOKEN: z.string().optional(),
  /** Storage backend selection. */
  PAYMENTS_BACKEND: z.enum(["prisma"]).optional(),
});

export type PmEnv = z.infer<typeof envSchema>;

function validateEnv(): PmEnv {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `payment-manager: invalid environment configuration:\n${issues}`,
    );
  }
  return result.data;
}

/**
 * Validated environment variables.
 *
 * Throws at module load time if required variables are missing or malformed.
 * In test environments the validation is skipped when NODE_ENV === "test" and
 * PAYMENT_MANAGER_E2E_ADMIN_TOKEN is set (E2E token implies a controlled test env).
 */
export const env: PmEnv = (() => {
  // Allow test environments to skip validation when using E2E token overrides.
  if (
    process.env.NODE_ENV === "test" &&
    process.env.PAYMENT_MANAGER_E2E_ADMIN_TOKEN
  ) {
    return envSchema
      .partial()
      .transform((v) => v as unknown as PmEnv)
      .parse(process.env);
  }
  return validateEnv();
})();
