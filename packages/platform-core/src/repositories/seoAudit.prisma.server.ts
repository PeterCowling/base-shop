import "server-only";

import type { SeoAuditEntry } from "./seoAudit.server";
import { readSeoAudits as jsonReadSeoAudits, appendSeoAudit as jsonAppendSeoAudit } from "./seoAudit.json.server";

export async function readSeoAudits(shop: string): Promise<SeoAuditEntry[]> {
  return jsonReadSeoAudits(shop);
}

export async function appendSeoAudit(
  shop: string,
  entry: SeoAuditEntry,
): Promise<void> {
  return jsonAppendSeoAudit(shop, entry);
}
