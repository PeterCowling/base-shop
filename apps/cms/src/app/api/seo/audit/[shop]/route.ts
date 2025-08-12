import { NextRequest, NextResponse } from "next/server";
import { DATA_ROOT } from "@platform-core";
import { validateShopName } from "@acme/lib";
import fs from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import chromeLauncher from "chrome-launcher";

interface AuditRecord {
  timestamp: string;
  score: number;
  issues: number;
}

function auditFile(shop: string) {
  return path.join(DATA_ROOT, shop, "seo-audit.json");
}

async function runLighthouse(url: string): Promise<AuditRecord> {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      onlyCategories: ["seo"],
      preset: "desktop",
    });
    const lhr = result.lhr;
    const score = lhr.categories?.seo?.score ?? 0;
    const issues = Object.values(lhr.audits).filter((a) => {
      return a.score !== 1 && a.score !== null && a.score !== undefined && a.scoreDisplayMode !== "notApplicable";
    }).length;
    return { timestamp: new Date().toISOString(), score, issues };
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
  try {
    const buf = await fs.readFile(auditFile(safeShop), "utf8");
    return NextResponse.json(JSON.parse(buf) as AuditRecord[]);
  } catch {
    return NextResponse.json([]);
  }
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

  const file = auditFile(safeShop);
  await fs.mkdir(path.dirname(file), { recursive: true });
  let history: AuditRecord[] = [];
  try {
    const buf = await fs.readFile(file, "utf8");
    history = JSON.parse(buf);
    if (!Array.isArray(history)) history = [];
  } catch {
    /* ignore */
  }
  history.push(record);
  await fs.writeFile(file, JSON.stringify(history, null, 2), "utf8");
  return NextResponse.json(record);
}
