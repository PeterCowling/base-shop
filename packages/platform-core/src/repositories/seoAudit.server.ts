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
  return path.join(DATA_ROOT, shop, "seo-audits.jsonl");
}

export async function readSeoAudits(shop: string): Promise<SeoAuditEntry[]> {
  try {
    const buf = await fs.readFile(auditPath(shop), "utf8");
    return buf
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as SeoAuditEntry);
  } catch {
    // ignore file errors
  }
  return [];
}

export async function appendSeoAudit(
  shop: string,
  entry: SeoAuditEntry,
): Promise<void> {
  const file = auditPath(shop);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(entry) + "\n", "utf8");
}
