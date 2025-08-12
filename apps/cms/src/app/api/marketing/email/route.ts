import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { sendCampaignEmail } from "@acme/email";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@platform-core/shops";
import { listEvents } from "@platform-core/repositories/analytics.server";
import { trackEvent } from "@platform-core/analytics";

interface Campaign {
  id: string;
  to: string;
  subject: string;
  body: string;
  sendAt: string;
}

function campaignsPath(shop: string): string {
  return path.join(DATA_ROOT, shop, "campaigns.json");
}

async function readCampaigns(shop: string): Promise<Campaign[]> {
  try {
    const buf = await fs.readFile(campaignsPath(shop), "utf8");
    return JSON.parse(buf) as Campaign[];
  } catch {
    return [];
  }
}

async function writeCampaigns(shop: string, campaigns: Campaign[]): Promise<void> {
  const fp = campaignsPath(shop);
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, JSON.stringify(campaigns, null, 2), "utf8");
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const shop = validateShopName(searchParams.get("shop") ?? "abc");

  const [campaigns, events] = await Promise.all([
    readCampaigns(shop),
    listEvents(shop),
  ]);

  const metricsById = campaigns.map((c) => {
    const sent = events.filter(
      (e) => e.type === "email_sent" && e.campaignId === c.id
    ).length;
    const opened = events.filter(
      (e) => e.type === "email_open" && e.campaignId === c.id
    ).length;
    const clicked = events.filter(
      (e) => e.type === "email_click" && e.campaignId === c.id
    ).length;
    return { ...c, metrics: { sent, opened, clicked } };
  });

  return NextResponse.json(metricsById);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const shop = validateShopName(searchParams.get("shop") ?? "abc");
  const { to, subject, body, sendAt } = (await req
    .json()
    .catch(() => ({}))) as {
    to?: string;
    subject?: string;
    body?: string;
    sendAt?: string;
  };

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const campaigns = await readCampaigns(shop);
  const id = Date.now().toString();
  const campaign: Campaign = {
    id,
    to,
    subject,
    body,
    sendAt: sendAt || new Date().toISOString(),
  };
  campaigns.push(campaign);

  try {
    await sendCampaignEmail({ to, subject, html: body });
    await writeCampaigns(shop, campaigns);
    await trackEvent(shop, { type: "email_sent", campaignId: id });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}

