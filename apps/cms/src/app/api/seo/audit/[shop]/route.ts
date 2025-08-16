import { NextRequest, NextResponse } from "next/server";
import { validateShopName } from "@acme/lib";
import lighthouse from "lighthouse";
import {
  appendSeoAudit,
  readSeoAudits,
  type SeoAuditEntry,
} from "@platform-core/repositories/seoAudit.server";
import { nowIso } from "@date-utils";
import validator from "validator";

const TRUSTED_HOSTS = (process.env.LIGHTHOUSE_TRUSTED_HOSTS || "localhost").split(
  /[,\s]+/,
);

async function runLighthouse(url: string): Promise<SeoAuditEntry> {
  const result = await lighthouse(
    url,
    {
      onlyCategories: ["seo"],
      chromeFlags: ["--headless"],
      preset: "desktop",
    } as any,
  );
  const lhr = result.lhr;
  const score = Math.round((lhr.categories?.seo?.score ?? 0) * 100);
  const recommendations = Object.values(lhr.audits)
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
  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const url = body.url || `http://localhost:3000/${safeShop}`;
  if (!validator.isURL(url, { require_tld: false })) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  const hostname = new URL(url).hostname;
  if (!TRUSTED_HOSTS.includes(hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
  }
  const record = await runLighthouse(url);
  await appendSeoAudit(safeShop, record);
  return NextResponse.json(record);
}

// For additional protection, consider running Lighthouse in a sandbox or via a safelist proxy.
