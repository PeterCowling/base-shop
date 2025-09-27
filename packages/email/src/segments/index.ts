import "server-only";
import { listEvents } from "@platform-core/repositories/analytics.server";
import type { AnalyticsEvent } from "@platform-core/analytics";
import { readSegments, analyticsMTime, SegmentCache, cacheTtl } from "./storage";
import { matches } from "./filters";
import { createContact, addToList, listSegments } from "./providers";

export { createContact, addToList, listSegments };
export { readSegments, analyticsMTime, SegmentCache, cacheTtl };
export type { SegmentDef } from "./filters";

const cache = new SegmentCache();

/**
 * Resolve a segment identifier to a list of customer email addresses based on
 * stored segment definitions.
 */
export async function resolveSegment(
  shop: string,
  id: string
): Promise<string[]> {
  const key = `${shop}:${id}`;
  const mtime = await analyticsMTime(shop);
  const cached = cache.get(key, mtime);
  if (cached) return cached;

  const segments = await readSegments(shop);
  const def = segments.find((s) => s.id === id);

  let events: AnalyticsEvent[] = [];
  try {
    events = await listEvents(shop);
  } catch (err) {
    console.error("Failed to list analytics events", err); // i18n-exempt: operational log
  }
  const emails = new Set<string>();

  if (def) {
    for (const e of events) {
      if (matches(def.filters, e)) {
        const email = e.email;
        if (typeof email === "string") emails.add(email);
      }
    }
  } else {
    for (const e of events) {
      const email = e.email;
      if (
        (e.type === `segment:${id}` ||
          (e.type === "segment" && (e as { segment?: string }).segment === id)) &&
        typeof email === "string"
      ) {
        emails.add(email);
      }
    }
  }

  const resolved = Array.from(emails);
  cache.set(key, mtime, resolved);
  return resolved;
}
