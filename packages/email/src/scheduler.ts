import { sendCampaignEmail } from "./send";
import { resolveSegment } from "./segments";
import { trackEvent } from "@platform-core/analytics";
import { coreEnv } from "@acme/config/env/core";
import { validateShopName } from "@acme/lib";
import { getCampaignStore } from "./storage";
import type { Campaign } from "./storage";
import { syncCampaignAnalytics as fetchCampaignAnalytics } from "./analytics";

function trackedBody(shop: string, id: string, body: string): string {
  const base = coreEnv.NEXT_PUBLIC_BASE_URL || "";
  const pixelUrl = `${base}/api/marketing/email/open?shop=${encodeURIComponent(
    shop,
  )}&campaign=${encodeURIComponent(id)}`;
  const bodyWithPixel =
    body +
    `<img src="${pixelUrl}" alt="" style="display:none" width="1" height="1"/>`;
  return bodyWithPixel.replace(
    /href="([^"]+)"/g,
    (_m, url) =>
      `href="${base}/api/marketing/email/click?shop=${encodeURIComponent(
        shop,
      )}&campaign=${encodeURIComponent(id)}&url=${encodeURIComponent(url)}"`,
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
  return getCampaignStore().readCampaigns(shop);
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
  const store = getCampaignStore();
  const campaigns = await store.readCampaigns(shop);
  campaigns.push(campaign);
  await store.writeCampaigns(shop, campaigns);
  return id;
}

export async function sendDueCampaigns(): Promise<void> {
  const store = getCampaignStore();
  const shops = await store.listShops();
  const now = new Date();
  for (const shop of shops) {
    const campaigns = await store.readCampaigns(shop);
    let changed = false;
    for (const c of campaigns) {
      if (c.sentAt || new Date(c.sendAt) > now) continue;
      await deliverCampaign(shop, c);
      changed = true;
    }
    if (changed) await store.writeCampaigns(shop, campaigns);
  }
}

/**
 * Periodically sync campaign analytics for all shops.
 */
export async function syncCampaignAnalytics(): Promise<void> {
  await fetchCampaignAnalytics();
}
