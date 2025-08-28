import { NextRequest, NextResponse } from "next/server";
import { validateShopName } from "@acme/lib";
import lighthouse from "lighthouse";
import isURL from "validator/lib/isURL";
import {
  appendSeoAudit,
  readSeoAudits,
  type SeoAuditEntry,
} from "@platform-core/repositories/seoAudit.server";
import { nowIso } from "@date-utils";

const TRUSTED_HOSTS = new Set(
  (process.env.LIGHTHOUSE_TRUSTED_HOSTS || "localhost")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

async function runLighthouse(url: string): Promise<SeoAuditEntry> {
  type Audit = {
    score?: number;
    scoreDisplayMode?: string;
    title?: string;
  };
  const flags = {
    onlyCategories: ["seo"],
    chromeFlags: ["--headless"],
    preset: "desktop",
  };
  const result: {
    lhr: {
      categories?: { seo?: { score?: number } };
      audits?: Record<string, Audit>;
    };
  } | undefined = await lighthouse(url, flags);
  if (!result) {
    throw new Error("Failed to run Lighthouse");
  }
  const lhr = result.lhr;
  const score = Math.round((lhr.categories?.seo?.score ?? 0) * 100);
  const recommendations = Object.values(lhr.audits ?? {})
    .filter(
      (a) => a.score !== 1 && a.scoreDisplayMode !== "notApplicable" && a.title,
    )
    .map((a) => a.title as string);
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
