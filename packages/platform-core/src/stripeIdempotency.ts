import "server-only";

import { createHash } from "node:crypto";

function stableStringify(value: unknown): string {
  if (value === null) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

export function buildStripeIdempotencyKey(prefix: string, payload: unknown): string {
  const safePrefix = prefix.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 48);
  const hash = createHash("sha256").update(stableStringify(payload)).digest("hex");
  return `${safePrefix}_${hash}`;
}
