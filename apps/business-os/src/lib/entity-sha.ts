import { computeFileSha } from "./file-sha";

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortKeysDeep(record[key]);
    }
    return sorted;
  }

  return value;
}

/**
 * Compute a stable SHA-256 for an entity by hashing a stable JSON representation.
 *
 * Used for optimistic concurrency checks and migration scripts.
 */
export function computeEntitySha(entity: Record<string, unknown>): string {
  const stableJson = JSON.stringify(sortKeysDeep(entity));
  return computeFileSha(stableJson);
}

