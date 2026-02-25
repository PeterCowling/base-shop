import { type NextRequest, NextResponse } from "next/server";
import { ensureShopAccess, ensureShopReadAccess } from "@cms/actions/common/auth";

import type { Campaign } from "@acme/email/types";
import { listEvents } from "@acme/platform-core/repositories/analytics.server";

const schedulerModuleId =
  process.env.ACME_EMAIL_SCHEDULER_MODULE_ID || "@acme/email/scheduler";

async function loadSchedulerModule(): Promise<typeof import("@acme/email/scheduler")> {
  return import(schedulerModuleId) as Promise<typeof import("@acme/email/scheduler")>;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop)
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  try {
    await ensureShopReadAccess(shop);
  } catch (err) {
    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message === "Forbidden" ? "Forbidden" : "Unauthorized" }, { status });
  }
  const { listCampaigns } = await loadSchedulerModule();
  const campaigns: Campaign[] = await listCampaigns(shop);
  const events = await listEvents();
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
  const list = Array.isArray(recipients) ? recipients : to ? [to] : [];
  if (!shop || !subject || !body || (list.length === 0 && !segment)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    await ensureShopAccess(shop);
  } catch (err) {
    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message === "Forbidden" ? "Forbidden" : "Unauthorized" }, { status });
  }
  const html = `${body}<p>%%UNSUBSCRIBE%%</p>`;
  try {
    const { createCampaign } = await loadSchedulerModule();
    const id = await createCampaign({
      shop,
      recipients: list,
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
