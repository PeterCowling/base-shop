import { promises as fs } from "node:fs";
import path from "node:path";
import { sendCampaignEmail, resolveSegment } from "./index";
import type { Campaign } from "./types";
import { trackEvent } from "@platform-core/analytics";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { coreEnv } from "@acme/config/env/core";


function campaignsPath(shop: string): string {
  return path.join(DATA_ROOT, shop, "campaigns.json");
}

export async function readCampaigns(shop: string): Promise<Campaign[]> {
  try {
    const buf = await fs.readFile(campaignsPath(shop), "utf8");
    const json = JSON.parse(buf);
    if (Array.isArray(json)) return json as Campaign[];
  } catch {}
  return [];
}

export async function writeCampaigns(
  shop: string,
  items: Campaign[]
): Promise<void> {
  await fs.mkdir(path.dirname(campaignsPath(shop)), { recursive: true });
  await fs.writeFile(
    campaignsPath(shop),
    JSON.stringify(items, null, 2),
    "utf8"
  );
}

export async function sendScheduledCampaigns(): Promise<void> {
  const shops = await fs.readdir(DATA_ROOT).catch(() => []);
  const now = new Date();
  for (const shop of shops) {
    const campaigns = await readCampaigns(shop);
    let changed = false;
    for (const c of campaigns) {
      if (c.sentAt || new Date(c.sendAt) > now) continue;
      const base = coreEnv.NEXT_PUBLIC_BASE_URL || "";
      const pixelUrl = `${base}/api/marketing/email/open?shop=${encodeURIComponent(
        shop
      )}&campaign=${encodeURIComponent(c.id)}`;
      const bodyWithPixel =
        c.body +
        `<img src="${pixelUrl}" alt="" style="display:none" width="1" height="1"/>`;
      const trackedBody = bodyWithPixel.replace(
        /href="([^"]+)"/g,
        (_m, url) =>
          `href="${base}/api/marketing/email/click?shop=${encodeURIComponent(
            shop
          )}&campaign=${encodeURIComponent(c.id)}&url=${encodeURIComponent(url)}"`
      );
      let recipients = c.recipients;
      if (c.segment) {
        recipients = await resolveSegment(shop, c.segment);
        c.recipients = recipients;
      }
      for (const r of recipients) {
        await sendCampaignEmail({
          to: r,
          subject: c.subject,
          html: trackedBody,
        });
        await trackEvent(shop, { type: "email_sent", campaign: c.id });
      }
      c.sentAt = new Date().toISOString();
      changed = true;
    }
    if (changed) await writeCampaigns(shop, campaigns);
  }
}

