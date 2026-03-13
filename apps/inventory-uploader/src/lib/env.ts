/**
 * Environment variable validation for inventory-uploader.
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
  INVENTORY_SESSION_SECRET: z.string().min(32, {
    message: "INVENTORY_SESSION_SECRET must be at least 32 characters",
  }),
  /** Bearer token accepted for admin API access. Must be at least 32 chars. */
  INVENTORY_ADMIN_TOKEN: z.string().min(32, {
    message: "INVENTORY_ADMIN_TOKEN must be at least 32 characters",
  }),
  /** Optional: comma-separated list of allowed client IP addresses. */
  INVENTORY_ALLOWED_IPS: z.string().optional(),
  /** Optional: database connection URL (not required in local dev without Prisma). */
  DATABASE_URL: z.string().optional(),
  /** Optional: selects the inventory storage backend. Defaults to "local" when absent. */
  INVENTORY_BACKEND: z.enum(["prisma", "local"]).optional(),
});

export type InventoryEnv = z.infer<typeof envSchema>;

function validateEnv(): InventoryEnv {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `inventory-uploader: invalid environment configuration:\n${issues}`,
    );
  }
  return result.data;
}

/**
 * Validated environment variables.
 *
 * Throws at module load time if required variables are missing or malformed.
 * In test environments the validation is skipped when NODE_ENV === "test" and
 * INVENTORY_E2E_ADMIN_TOKEN is set (E2E token implies a controlled test env).
 */
export const env: InventoryEnv = (() => {
  // Allow test environments to skip validation when using E2E token overrides.
  if (
    process.env.NODE_ENV === "test" &&
    process.env.INVENTORY_E2E_ADMIN_TOKEN
  ) {
    return envSchema
      .partial()
      .transform((v) => v as unknown as InventoryEnv)
      .parse(process.env);
  }
  return validateEnv();
})();
