import "server-only";
import { listEvents } from "@platform-core/repositories/analytics.server";
import type { AnalyticsEvent } from "@platform-core/analytics";
import { validateShopName } from "@acme/lib";
import { getCampaignStore } from "./storage";
import type { Campaign } from "./types";
import { syncCampaignAnalytics as fetchCampaignAnalytics } from "./analytics";

export interface Clock {
  now(): Date;
}

let clock: Clock = { now: () => new Date() };

export function setClock(c: Clock): void {
  clock = c;
}

function trackedBody(shop: string, id: string, body: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const pixelUrl = `${base}/api/marketing/email/open?shop=${encodeURIComponent(
    shop,
  )}&campaign=${encodeURIComponent(id)}&t=${Date.now()}`;
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

export function unsubscribeUrl(
  shop: string,
  campaign: string,
  recipient: string,
): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  return `${base}/api/marketing/email/unsubscribe?shop=${encodeURIComponent(
    shop,
  )}&campaign=${encodeURIComponent(campaign)}&email=${encodeURIComponent(
    recipient,
  )}`;
}

async function filterUnsubscribed(
  shop: string,
  recipients: string[],
): Promise<string[]> {
  const events: AnalyticsEvent[] = await listEvents(shop).catch(
    (): AnalyticsEvent[] => [],
  );
  const unsub = new Set(
    events
      .filter(
        (e: AnalyticsEvent): e is AnalyticsEvent & { email: string } =>
          e.type === "email_unsubscribe" && typeof e.email === "string",
      )
      .map((e) => e.email),
  );
  return recipients.filter((r) => !unsub.has(r));
}

async function deliverCampaign(shop: string, c: Campaign): Promise<void> {
  shop = validateShopName(shop);
  let rendered = c.body;
  if (c.templateId) {
    const { renderTemplate } = await import("./templates");
    rendered = renderTemplate(c.templateId, {
      subject: c.subject,
      body: c.body,
    });
  }
  const baseHtml = trackedBody(shop, c.id, rendered);
  let recipients = c.recipients;
  if (c.segment) {
    const { resolveSegment } = await import("./segments");
    recipients = await resolveSegment(shop, c.segment);
    c.recipients = recipients;
  }
  recipients = await filterUnsubscribed(shop, recipients);
  const hasPlaceholder = baseHtml.includes("%%UNSUBSCRIBE%%");
  const batchSize = Number(process.env.EMAIL_BATCH_SIZE) || 100;
  const batchDelay =
    process.env.EMAIL_BATCH_DELAY_MS === undefined
      ? 1000
      : Number(process.env.EMAIL_BATCH_DELAY_MS);
  const failures: { recipient: string; error: unknown }[] = [];
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    for (const r of batch) {
      const url = unsubscribeUrl(shop, c.id, r);
      let html = baseHtml;
      if (hasPlaceholder) {
        html = baseHtml.replace(
          /%%UNSUBSCRIBE%%/g,
          `<a href="${url}">Unsubscribe</a>`,
        ); // i18n-exempt: default unsubscribe label in emails
      } else {
        html = `${baseHtml}<p><a href="${url}">Unsubscribe</a></p>`; // i18n-exempt: default unsubscribe label in emails
      }
      const { sendCampaignEmail } = await import("./send");
      try {
        await sendCampaignEmail({
          to: r,
          subject: c.subject,
          html,
        });
      } catch (error) {
        console.error("Campaign email send failed", { // i18n-exempt: operational log
          recipient: r,
          campaignId: c.id,
          error,
        });
        failures.push({ recipient: r, error });
        continue;
      }
      const { emitSend } = await import("./hooks");
      await emitSend(shop, { campaign: c.id });
    }
    if (i + batchSize < recipients.length && batchDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, batchDelay));
    }
  }
  c.sentAt = clock.now().toISOString();
  if (failures.length === 1) throw failures[0].error;
  if (failures.length > 1) {
    throw new AggregateError(
      failures.map((f) => f.error),
      "Failed to send some campaign emails", // i18n-exempt: operational error summary
    );
  }
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
  let { shop, recipients = [] } = opts;
  const { subject, body, segment, sendAt, templateId } = opts;
  shop = validateShopName(shop);
  if (recipients.length === 0 && segment) {
    const { resolveSegment } = await import("./segments");
    recipients = await resolveSegment(shop, segment);
  }
  if (!shop || !subject || !body || recipients.length === 0) {
    throw new Error("Missing fields"); // i18n-exempt: developer validation error
  }
  const id = clock.now().getTime().toString(36);
  const scheduled = sendAt ? new Date(sendAt) : clock.now();
  const campaign: Campaign = {
    id,
    recipients,
    subject,
    body,
    segment: segment ?? null,
    sendAt: scheduled.toISOString(),
    templateId: templateId ?? null,
  };
  if (scheduled <= clock.now()) {
    try {
      await deliverCampaign(shop, campaign);
    } catch (err) {
      console.error(`Failed to deliver campaign ${campaign.id}`, err); // i18n-exempt: operational log
      throw err;
    }
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
  const now = clock.now();
  const failedCampaigns: { id: string; error: unknown }[] = [];
  for (const shop of shops) {
    const campaigns = await store.readCampaigns(shop);
    let changed = false;
    for (const c of campaigns) {
      if (c.sentAt || new Date(c.sendAt) > now) continue;
      try {
        await deliverCampaign(shop, c);
        changed = true;
      } catch (err) {
        console.error(`Failed to deliver campaign ${c.id}`, err); // i18n-exempt: operational log
        failedCampaigns.push({ id: c.id, error: err });
      }
    }
    if (changed) await store.writeCampaigns(shop, campaigns);
  }
  if (failedCampaigns.length > 0) {
    const ids = failedCampaigns.map((f) => f.id).join(", ");
    console.error(`Failed campaigns: ${ids}`); // i18n-exempt: operational log
    if (failedCampaigns.length === 1) {
      throw failedCampaigns[0].error;
    }
    throw new AggregateError(
      failedCampaigns.map((f) => f.error),
      `Failed campaigns: ${ids}`, // i18n-exempt: operational error summary
    );
  }
}

/**
 * Periodically sync campaign analytics for all shops.
 */
export async function syncCampaignAnalytics(): Promise<void> {
  try {
    await fetchCampaignAnalytics();
  } catch {
    // ignore analytics sync errors to avoid crashing scheduled jobs
  }
}
