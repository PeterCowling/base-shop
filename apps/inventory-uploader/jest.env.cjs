/**
 * Jest environment setup: pre-populate required env vars before any module
 * loads, so env.ts module-level validation does not throw in test runs.
 * Individual tests override these as needed in their own setup.
 */
process.env.INVENTORY_SESSION_SECRET =
  process.env.INVENTORY_SESSION_SECRET || "test-session-secret-32-chars-minimum!";
process.env.INVENTORY_ADMIN_TOKEN =
  process.env.INVENTORY_ADMIN_TOKEN || "test-admin-token-32-chars-minimum-xx!";
