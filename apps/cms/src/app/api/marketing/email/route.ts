import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { marketingEmailVariants } from "@acme/ui";
import { sendCampaignEmail } from "@acme/email";
import { trackEvent } from "@platform-core/analytics";
import { listEvents } from "@platform-core/repositories/analytics.server";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@acme/lib";
import { env } from "@acme/config";

interface Campaign {
  id: string;
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  sentAt: string;
}

function campaignsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "campaigns.json");
}

async function readCampaigns(shop: string): Promise<Campaign[]> {
  try {
    const buf = await fs.readFile(campaignsPath(shop), "utf8");
    const json = JSON.parse(buf);
    if (Array.isArray(json)) return json as Campaign[];
    return [];
  } catch {
    return [];
  }
}

async function writeCampaigns(shop: string, items: Campaign[]): Promise<void> {
  await fs.mkdir(path.dirname(campaignsPath(shop)), { recursive: true });
  await fs.writeFile(campaignsPath(shop), JSON.stringify(items, null, 2), "utf8");
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  const campaigns = await readCampaigns(shop);
  const events = await listEvents(shop);
  const withMetrics = campaigns.map((c) => {
    const metrics = { sent: 0, opened: 0, clicked: 0 };
    for (const e of events) {
      if (e.campaign !== c.id) continue;
      if (e.type === "email_sent") metrics.sent += 1;
      else if (e.type === "email_open") metrics.opened += 1;
      else if (e.type === "email_click") metrics.clicked += 1;
    }
    return { ...c, metrics };
  });
  return NextResponse.json({ campaigns: withMetrics });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { shop, to, subject, body, templateId } = (await req
    .json()
    .catch(() => ({}))) as {
    shop?: string;
    to?: string;
    subject?: string;
    body?: string;
    templateId?: string;
  };
  if (!shop || !to || !subject || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const id = Date.now().toString(36);
  const sentAt = new Date().toISOString();
  const base = env.NEXT_PUBLIC_BASE_URL || "";
  const variant =
    marketingEmailVariants.find((v) => v.id === templateId) ||
    marketingEmailVariants[0];
  const html = renderToStaticMarkup(
    React.createElement(variant.component, {
      headline: subject,
      content: React.createElement("div", {
        dangerouslySetInnerHTML: { __html: body },
      }),
    })
  );
  const pixelUrl = `${base}/api/marketing/email/open?shop=${encodeURIComponent(
    shop
  )}&campaign=${encodeURIComponent(id)}`;
  const bodyWithPixel =
    html +
    `<img src="${pixelUrl}" alt="" style="display:none" width="1" height="1"/>`;
  const trackedBody = bodyWithPixel.replace(
    /href="([^"]+)"/g,
    (_m, url) =>
      `href="${base}/api/marketing/email/click?shop=${encodeURIComponent(
        shop
      )}&campaign=${encodeURIComponent(id)}&url=${encodeURIComponent(url)}"`
  );
  try {
    await sendCampaignEmail({ to, subject, html: trackedBody });
    await trackEvent(shop, { type: "email_sent", campaign: id });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
  const campaigns = await readCampaigns(shop);
  campaigns.push({ id, to, subject, body: html, templateId, sentAt });
  await writeCampaigns(shop, campaigns);
  return NextResponse.json({ ok: true, id });
}
