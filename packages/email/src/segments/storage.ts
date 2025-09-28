import { promises as fs } from "fs";
import path from "path";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@acme/lib";
import type { SegmentDef } from "./filters";

export async function readSegments(shop: string): Promise<SegmentDef[]> {
  shop = validateShopName(shop);
  const file = path.join(DATA_ROOT, shop, "segments.json");
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop>/segments.json [EMAIL-1000]
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop>/analytics.jsonl [EMAIL-1000]
    const stat = await fs.stat(file);
    return stat.mtimeMs;
  } catch {
    return 0;
  }
}

interface CacheEntry {
  emails: string[];
  expires: number;
  mtimeMs: number;
}

export class SegmentCache {
  private cache = new Map<string, CacheEntry>();

  get(key: string, mtime: number): string[] | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expires > Date.now() && entry.mtimeMs === mtime) {
      return entry.emails;
    }
  }

  set(key: string, mtime: number, emails: string[]): void {
    const ttl = cacheTtl();
    this.cache.set(key, {
      emails,
      mtimeMs: mtime,
      expires: Date.now() + ttl,
    });
  }
}
