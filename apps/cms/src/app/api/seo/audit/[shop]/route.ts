import { NextRequest, NextResponse } from "next/server";
import { validateShopName } from "@acme/lib";
import isURL from "validator/lib/isURL";
import {
  appendSeoAudit,
  readSeoAudits,
  type SeoAuditEntry,
} from "@platform-core/repositories/seoAudit.server";
import { nowIso } from "@date-utils";
import type { RunnerResult } from "lighthouse";
import type { Result as AuditResult } from "lighthouse/types/lhr/audit-result.js";

export const TRUSTED_HOSTS = new Set(
  (process.env.LIGHTHOUSE_TRUSTED_HOSTS || "localhost")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

export async function runLighthouse(url: string): Promise<SeoAuditEntry> {
  const { default: lighthouse } = await import("lighthouse");

  const flags = {
    onlyCategories: ["seo"],
    chromeFlags: ["--headless"],
    preset: "desktop",
  };
  const result: RunnerResult | undefined = await lighthouse(url, flags);
  if (!result) {
    throw new Error("Failed to run Lighthouse");
  }
  const lhr = result.lhr;
  const score = Math.round((lhr.categories?.seo?.score ?? 0) * 100);
  const audits: AuditResult[] = Object.values(lhr.audits);
  const recommendations = audits
    .filter(
      (a) =>
        a.score !== 1 &&
        a.scoreDisplayMode !== "notApplicable" &&
        !!a.title,
    )
    .map((a) => a.title);
  return { timestamp: nowIso(), score, recommendations };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const { shop } = await context.params;
  const safeShop = validateShopName(shop);
  const audits = await readSeoAudits(safeShop);
  return NextResponse.json(audits);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const { shop } = await context.params;
  const safeShop = validateShopName(shop);
  const body = await req.json().catch(() => ({} as { url?: string }));
  const urlStr = body.url || `http://localhost:3000/${safeShop}`;

  if (!isURL(urlStr, { require_protocol: true })) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const { hostname } = new URL(urlStr);
  if (!TRUSTED_HOSTS.has(hostname.toLowerCase())) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  // Consider running Lighthouse in a sandbox or using a safelist proxy.
  const record = await runLighthouse(urlStr);
  await appendSeoAudit(safeShop, record);
  return NextResponse.json(record);
}
