import { listEvents } from "@platform-core/repositories/analytics.server";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@platform-core/shops";
import { stat } from "node:fs/promises";
import * as path from "node:path";

type CacheEntry = {
  emails: string[];
  expiresAt: number;
  mtimeMs: number;
};

const cache = new Map<string, CacheEntry>();

function analyticsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "analytics.jsonl");
}

/**
 * Resolve a segment identifier to a list of customer email addresses.
 *
 * Segments are represented in analytics events with either the form:
 *  { type: `segment:${id}`, email: "user@example.com" }
 * or
 *  { type: "segment", segment: id, email: "user@example.com" }
 */
export async function resolveSegment(
  shop: string,
  id: string,
  ttlMs = 60_000
): Promise<string[]> {
  const key = `${shop}:${id}`;
  const now = Date.now();
  const { mtimeMs } = await stat(analyticsPath(shop)).catch(() => ({ mtimeMs: 0 }));
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now && cached.mtimeMs === mtimeMs) {
    return cached.emails;
  }

  const events = await listEvents(shop);
  const emails = new Set<string>();
  for (const e of events) {
    const type = (e as { type?: string }).type;
    const seg =
      type === `segment:${id}`
        ? id
        : type === "segment" && (e as any).segment === id
          ? id
          : null;
    if (seg) {
      const email = (e as any).email;
      if (typeof email === "string") emails.add(email);
    }
  }
  const result = Array.from(emails);
  cache.set(key, { emails: result, expiresAt: now + ttlMs, mtimeMs });
  return result;
}
