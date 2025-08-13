import { NextRequest, NextResponse } from "next/server";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createCampaign,
  listCampaigns,
  type Campaign,
} from "@acme/email";
import { listEvents } from "@platform-core/repositories/analytics.server";
import { marketingEmailTemplates } from "@acme/ui";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop)
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  const campaigns = await listCampaigns(shop);
  const events = await listEvents(shop);
  const withMetrics = campaigns.map((c: Campaign) => {
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
  const {
    shop,
    recipients,
    to,
    subject,
    body,
    segment,
    sendAt,
    templateId,
  } = (await req
    .json()
    .catch(() => ({}))) as {
    shop?: string;
    recipients?: string[];
    to?: string;
    subject?: string;
    body?: string;
    segment?: string;
    sendAt?: string;
    templateId?: string;
  };
  if (!shop || !subject || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  let html = body;
  if (templateId) {
    const variant = marketingEmailTemplates.find((t) => t.id === templateId);
    if (variant) {
      html = renderToStaticMarkup(
        variant.render({
          headline: subject,
          content: React.createElement("div", {
            dangerouslySetInnerHTML: { __html: body },
          }),
        }),
      );
    }
  }
  try {
    const { id } = await createCampaign({
      shop,
      recipients,
      to,
      subject,
      body: html,
      segment,
      sendAt,
      templateId,
    });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
