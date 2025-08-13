import { sendCampaignEmail, resolveSegment, createFsCampaignStore } from "@acme/email";
import type { CampaignStore } from "@acme/email";
import { trackEvent } from "@platform-core/analytics";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { coreEnv } from "@acme/config/env/core";

export async function sendScheduledCampaigns(
  store: CampaignStore = createFsCampaignStore(DATA_ROOT),
): Promise<void> {
  const shops = await store.listShops();
  const now = new Date();
  for (const shop of shops) {
    const campaigns = await store.readCampaigns(shop);
    let changed = false;
    for (const c of campaigns) {
      if (c.sentAt || new Date(c.sendAt) > now) continue;
      const base = coreEnv.NEXT_PUBLIC_BASE_URL || "";
      const pixelUrl = `${base}/api/marketing/email/open?shop=${encodeURIComponent(
        shop,
      )}&campaign=${encodeURIComponent(c.id)}`;
      const bodyWithPixel =
        c.body +
        `<img src="${pixelUrl}" alt="" style="display:none" width="1" height="1"/>`;
      const trackedBody = bodyWithPixel.replace(
        /href="([^"]+)"/g,
        (_m, url) =>
          `href="${base}/api/marketing/email/click?shop=${encodeURIComponent(
            shop,
          )}&campaign=${encodeURIComponent(c.id)}&url=${encodeURIComponent(url)}"`,
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
    if (changed) await store.writeCampaigns(shop, campaigns);
  }
}

export const onScheduled = async () => {
  await sendScheduledCampaigns();
};
