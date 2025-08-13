import { promises as fs } from "node:fs";
import path from "node:path";
import { sendCampaignEmail, resolveSegment } from "./index";
import { trackEvent } from "@platform-core/analytics";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { coreEnv } from "@acme/config/env/core";
import { validateShopName } from "@acme/lib";

interface Campaign {
  id: string;
  recipients: string[];
  subject: string;
  body: string;
  segment?: string | null;
  sendAt: string;
  sentAt?: string;
  templateId?: string | null;
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
  } catch {}
  return [];
}

async function writeCampaigns(shop: string, items: Campaign[]): Promise<void> {
  await fs.mkdir(path.dirname(campaignsPath(shop)), { recursive: true });
  await fs.writeFile(
    campaignsPath(shop),
    JSON.stringify(items, null, 2),
    "utf8"
  );
}

function trackedBody(shop: string, id: string, body: string): string {
  const base = coreEnv.NEXT_PUBLIC_BASE_URL || "";
  const pixelUrl = `${base}/api/marketing/email/open?shop=${encodeURIComponent(
    shop
  )}&campaign=${encodeURIComponent(id)}&t=${Date.now()}`;
  const bodyWithPixel =
    body +
    `<img src="${pixelUrl}" alt="" style="display:none" width="1" height="1"/>`;
  return bodyWithPixel.replace(
    /href="([^"]+)"/g,
    (_m, url) =>
      `href="${base}/api/marketing/email/click?shop=${encodeURIComponent(
        shop
      )}&campaign=${encodeURIComponent(id)}&url=${encodeURIComponent(url)}"`
  );
}

async function deliverCampaign(shop: string, c: Campaign): Promise<void> {
  shop = validateShopName(shop);
  const html = trackedBody(shop, c.id, c.body);
  let recipients = c.recipients;
  if (c.segment) {
    recipients = await resolveSegment(shop, c.segment);
    c.recipients = recipients;
  }
  for (const r of recipients) {
    await sendCampaignEmail({
      to: r,
      subject: c.subject,
      html,
    });
    await trackEvent(shop, { type: "email_sent", campaign: c.id });
  }
  c.sentAt = new Date().toISOString();
}

export async function listCampaigns(shop: string): Promise<Campaign[]> {
  return readCampaigns(shop);
}

export async function createCampaign(opts: {
  shop: string;
  recipients?: string[];
  subject: string;
  body: string;
  segment?: string;
  sendAt?: string;
  templateId?: string | null;
}): Promise<string> {
  let {
    shop,
    recipients = [],
    subject,
    body,
    segment,
    sendAt,
    templateId,
  } = opts;
  shop = validateShopName(shop);
  if (recipients.length === 0 && segment) {
    recipients = await resolveSegment(shop, segment);
  }
  if (!shop || !subject || !body || recipients.length === 0) {
    throw new Error("Missing fields");
  }
  const id = Date.now().toString(36);
  const scheduled = sendAt ? new Date(sendAt) : new Date();
  const campaign: Campaign = {
    id,
    recipients,
    subject,
    body,
    segment: segment ?? null,
    sendAt: scheduled.toISOString(),
    templateId: templateId ?? null,
  };
  if (scheduled <= new Date()) {
    await deliverCampaign(shop, campaign);
  }
  const campaigns = await readCampaigns(shop);
  campaigns.push(campaign);
  await writeCampaigns(shop, campaigns);
  return id;
}

export async function sendDueCampaigns(): Promise<void> {
  const shops = await fs.readdir(DATA_ROOT).catch(() => []);
  const now = new Date();
  for (const shop of shops) {
    const campaigns = await readCampaigns(shop);
    let changed = false;
    for (const c of campaigns) {
      if (c.sentAt || new Date(c.sendAt) > now) continue;
      await deliverCampaign(shop, c);
      changed = true;
    }
    if (changed) await writeCampaigns(shop, campaigns);
  }
}

