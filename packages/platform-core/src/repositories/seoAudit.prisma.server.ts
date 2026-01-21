import "server-only";

import { appendSeoAudit as jsonAppendSeoAudit,readSeoAudits as jsonReadSeoAudits } from "./seoAudit.json.server";
import type { SeoAuditEntry } from "./seoAudit.server";

export async function readSeoAudits(shop: string): Promise<SeoAuditEntry[]> {
  return jsonReadSeoAudits(shop);
}

export async function appendSeoAudit(
  shop: string,
  entry: SeoAuditEntry,
): Promise<void> {
  return jsonAppendSeoAudit(shop, entry);
}
