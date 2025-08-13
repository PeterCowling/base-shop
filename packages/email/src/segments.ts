import { listEvents } from "@platform-core/repositories/analytics.server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@acme/lib";
import { listUnsubscribed } from "./unsubscribe";

interface SegmentDef {
  id: string;
  filters: { field: string; value: string }[];
}

async function readSegments(shop: string): Promise<SegmentDef[]> {
  shop = validateShopName(shop);
  const file = path.join(DATA_ROOT, shop, "segments.json");
  try {
    const buf = await fs.readFile(file, "utf8");
    const json = JSON.parse(buf);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

/**
 * Resolve a segment identifier to a list of customer email addresses based on
 * stored segment definitions.
 */
export async function resolveSegment(
  shop: string,
  id: string
): Promise<string[]> {
  const segments = await readSegments(shop);
  const def = segments.find((s) => s.id === id);
  if (!def) return [];
  const events = await listEvents(shop);
  const emails = new Set<string>();
  for (const e of events) {
    let match = true;
    for (const f of def.filters) {
      if ((e as any)[f.field] !== f.value) {
        match = false;
        break;
      }
    }
    if (match) {
      const email = (e as any).email;
      if (typeof email === "string") emails.add(email);
    }
  }
  const unsubscribed = await listUnsubscribed(shop);
  return Array.from(emails).filter((e) => !unsubscribed.has(e));
}
