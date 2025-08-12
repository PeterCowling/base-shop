import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";

export interface SeoAuditEntry {
  timestamp: string;
  score: number;
  recommendations?: string[];
}

function auditPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "seo-audit.json");
}

export async function readSeoAudits(shop: string): Promise<SeoAuditEntry[]> {
  try {
    const buf = await fs.readFile(auditPath(shop), "utf8");
    const data = JSON.parse(buf) as SeoAuditEntry[];
    if (Array.isArray(data)) return data;
  } catch {
    // ignore file errors
  }
  return [];
}
