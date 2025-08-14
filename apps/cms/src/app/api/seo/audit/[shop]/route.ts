import { NextRequest, NextResponse } from "next/server";
import { validateShopName } from "@acme/lib";
import lighthouse from "lighthouse";
import chromeLauncher from "chrome-launcher";
import {
  appendSeoAudit,
  readSeoAudits,
  type SeoAuditEntry,
} from "@platform-core/repositories/seoAudit.server";
import { nowIso } from "@acme/date-utils";

async function runLighthouse(url: string): Promise<SeoAuditEntry> {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      onlyCategories: ["seo"],
      preset: "desktop",
    });
    const lhr = result.lhr;
    const score = Math.round((lhr.categories?.seo?.score ?? 0) * 100);
    const recommendations = Object.values(lhr.audits)
      .filter(
        (a) =>
          a.score !== 1 &&
          a.scoreDisplayMode !== "notApplicable" &&
          a.title,
      )
      .map((a) => a.title as string);
    return { timestamp: nowIso(), score, recommendations };
  } finally {
    await chrome.kill();
  }
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
  const url = body.url || `http://localhost:3000/${safeShop}`;
  const record = await runLighthouse(url);
  await appendSeoAudit(safeShop, record);
  return NextResponse.json(record);
}
