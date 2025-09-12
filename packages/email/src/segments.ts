import "server-only";
import { listEvents } from "@platform-core/repositories/analytics.server";
import type { AnalyticsEvent } from "@platform-core/analytics";
import { promises as fs } from "fs";
import path from "path";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@acme/lib";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
import type { CampaignProvider } from "./providers/types";

type ComparisonOp = "gt" | "lt" | "gte" | "lte" | "eq";

interface FieldFilter {
  field: string;
  value: string;
  op?: ComparisonOp;
}

interface AndFilter {
  and: Filter[];
}

interface OrFilter {
  or: Filter[];
}

type Filter = FieldFilter | AndFilter | OrFilter;

interface SegmentDef {
  id: string;
  filters: Filter | Filter[];
}

interface CacheEntry {
  emails: string[];
  expires: number;
  mtimeMs: number;
}

const providers: Record<string, CampaignProvider> = {
  sendgrid: new SendgridProvider(),
  resend: new ResendProvider(),
};

function getProvider(): CampaignProvider | undefined {
  const name = process.env.EMAIL_PROVIDER ?? "";
  return providers[name];
}

export async function readSegments(shop: string): Promise<SegmentDef[]> {
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

export function cacheTtl(): number {
  const ttl = Number(process.env.SEGMENT_CACHE_TTL);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 60_000;
}

export async function analyticsMTime(shop: string): Promise<number> {
  const file = path.join(
    DATA_ROOT,
    validateShopName(shop),
    "analytics.jsonl"
  );
  try {
    const stat = await fs.stat(file);
    return stat.mtimeMs;
  } catch {
    return 0;
  }
}

const segmentCache = new Map<string, CacheEntry>();

export async function createContact(email: string): Promise<string> {
  const provider = getProvider();
  if (provider?.createContact) {
    try {
      return await provider.createContact(email);
    } catch {
      return "";
    }
  }
  return "";
}

export async function addToList(
  contactId: string,
  listId: string
): Promise<void> {
  const provider = getProvider();
  if (provider?.addToList)
    try {
      await provider.addToList(contactId, listId);
    } catch {
      /* noop */
    }
}

export async function listSegments(): Promise<{ id: string; name?: string }[]> {
  const provider = getProvider();
  if (provider?.listSegments)
    try {
      return await provider.listSegments();
    } catch {
      return [];
    }
  return [];
}

/**
 * Resolve a segment identifier to a list of customer email addresses based on
 * stored segment definitions.
 */
export async function resolveSegment(
  shop: string,
  id: string
): Promise<string[]> {
  const key = `${shop}:${id}`;
  const now = Date.now();
  const mtime = await analyticsMTime(shop);
  const cached = segmentCache.get(key);
  if (cached && cached.expires > now && cached.mtimeMs === mtime) {
    return cached.emails;
  }

  const segments = await readSegments(shop);
  const def = segments.find((s) => s.id === id);

  let events: AnalyticsEvent[] = [];
  try {
    events = await listEvents(shop);
  } catch (err) {
    console.error("Failed to list analytics events", err);
  }
  const emails = new Set<string>();

  const matches = (filter: Filter | Filter[] | undefined, event: AnalyticsEvent): boolean => {
    if (!filter) return true;
    if (Array.isArray(filter)) {
      return filter.every((f) => matches(f, event));
    }
    if ("and" in filter) {
      return (filter.and ?? []).every((f) => matches(f, event));
    }
    if ("or" in filter) {
      return (filter.or ?? []).some((f) => matches(f, event));
    }

    const { field, value, op = "eq" } = filter;
    const evVal = (event as Record<string, unknown>)[field];
    if (evVal === undefined || evVal === null) return false;

    const numEv = typeof evVal === "number" ? evVal : Number(evVal);
    const numVal = Number(value);
    if (Number.isFinite(numEv) && Number.isFinite(numVal)) {
      switch (op) {
        case "gt":
          return numEv > numVal;
        case "gte":
          return numEv >= numVal;
        case "lt":
          return numEv < numVal;
        case "lte":
          return numEv <= numVal;
        default:
          return numEv === numVal;
      }
    }

    const dateEv = Date.parse(String(evVal));
    const dateVal = Date.parse(value);
    if (!Number.isNaN(dateEv) && !Number.isNaN(dateVal)) {
      switch (op) {
        case "gt":
          return dateEv > dateVal;
        case "gte":
          return dateEv >= dateVal;
        case "lt":
          return dateEv < dateVal;
        case "lte":
          return dateEv <= dateVal;
        default:
          return dateEv === dateVal;
      }
    }

    return op === "eq" && String(evVal) === value;
  };

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
  segmentCache.set(key, {
    emails: resolved,
    expires: now + cacheTtl(),
    mtimeMs: mtime,
  });
  return resolved;
}
