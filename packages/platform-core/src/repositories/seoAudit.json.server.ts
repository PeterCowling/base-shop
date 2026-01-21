/* eslint-disable security/detect-non-literal-fs-filename -- ABC-123: Paths derive from controlled DATA_ROOT + validated shop name */
import "server-only";

import { promises as fs } from "fs";
import * as path from "path";

import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops/index";

import type { SeoAuditEntry } from "./seoAudit.server";

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
