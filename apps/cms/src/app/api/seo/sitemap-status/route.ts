import { type NextRequest, NextResponse } from "next/server";
import { nowIso } from "@date-utils";

import { env } from "@acme/config";

async function fetchHead(url: string): Promise<{ lastModified?: string; contentLength?: number }> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return {};
    const lastModified = res.headers.get("last-modified") ?? undefined;
    const len = res.headers.get("content-length");
    const contentLength = len ? Number(len) : undefined;
    return { lastModified, contentLength };
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin.replace(/\/$/, "");
  const sitemapUrl = `${origin}/sitemap.xml`;
  const aiSitemapUrl = `${origin}/ai-sitemap.xml`;

  const [main, ai] = await Promise.all([fetchHead(sitemapUrl), fetchHead(aiSitemapUrl)]);

  return NextResponse.json({
    origin,
    sitemap: { url: sitemapUrl, ...main },
    aiSitemap: { url: aiSitemapUrl, ...ai },
  });
}

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin.replace(/\/$/, "");
  const webhook = String(env?.SITEMAP_REBUILD_WEBHOOK ?? process.env.SITEMAP_REBUILD_WEBHOOK ?? "");
  if (!webhook) {
    return NextResponse.json(
      { error: "SITEMAP_REBUILD_WEBHOOK not configured", origin },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, reason: "seo-panel" }),
    });
    if (!res.ok) {
      throw new Error(`Webhook returned ${res.status}`);
    }
    return NextResponse.json(
      { message: "Sitemap rebuild triggered via webhook", origin, rebuild: { status: res.status, detail: nowIso() } },
      { status: 202 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to trigger sitemap rebuild", detail: String(err), origin, rebuild: { status: 500 } },
      { status: 500 },
    );
  }
}
