import crypto from "node:crypto";

/**
 * Compute a stable SHA-256 hex digest for a given UTF-8 string.
 *
 * Used for optimistic concurrency checks without relying on git commit SHAs
 * (which can be ambiguous across merges/branches).
 */
export function computeFileSha(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}
