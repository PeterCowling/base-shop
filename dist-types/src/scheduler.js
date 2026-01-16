import { sendCampaignEmail } from "./send";
import { resolveSegment } from "./segments";
import { emitSend } from "./hooks";
import { listEvents } from "@acme/platform-core/repositories/analytics.server";
import { coreEnv } from "@acme/config/env/core";
import { validateShopName } from "@acme/lib";
import { getCampaignStore } from "./storage";
import { syncCampaignAnalytics as fetchCampaignAnalytics } from "./analytics";
import { renderTemplate } from "./templates";
let clock = { now: () => new Date() };
export function setClock(c) {
    clock = c;
}
function trackedBody(shop, id, body) {
    const base = coreEnv.NEXT_PUBLIC_BASE_URL || "";
    const pixelUrl = `${base}/api/marketing/email/open?shop=${encodeURIComponent(shop)}&campaign=${encodeURIComponent(id)}&t=${Date.now()}`;
    const bodyWithPixel = body +
        `<img src="${pixelUrl}" alt="" style="display:none" width="1" height="1"/>`;
    return bodyWithPixel.replace(/href="([^"]+)"/g, (_m, url) => `href="${base}/api/marketing/email/click?shop=${encodeURIComponent(shop)}&campaign=${encodeURIComponent(id)}&url=${encodeURIComponent(url)}"`);
}
function unsubscribeUrl(shop, campaign, recipient) {
    const base = coreEnv.NEXT_PUBLIC_BASE_URL || "";
    return `${base}/api/marketing/email/unsubscribe?shop=${encodeURIComponent(shop)}&campaign=${encodeURIComponent(campaign)}&email=${encodeURIComponent(recipient)}`;
}
async function filterUnsubscribed(shop, recipients) {
    const events = await listEvents().catch(() => []);
    const unsub = new Set(events
        .filter((e) => e.type === "email_unsubscribe" && typeof e.email === "string")
        .map((e) => e.email));
    return recipients.filter((r) => !unsub.has(r));
}
async function deliverCampaign(shop, c) {
    shop = validateShopName(shop);
    let rendered = c.body;
    if (c.templateId) {
        rendered = renderTemplate(c.templateId, {
            subject: c.subject,
            body: c.body,
        });
    }
    const baseHtml = trackedBody(shop, c.id, rendered);
    let recipients = c.recipients;
    if (c.segment) {
        recipients = await resolveSegment(shop, c.segment);
        c.recipients = recipients;
    }
    recipients = await filterUnsubscribed(shop, recipients);
    const hasPlaceholder = baseHtml.includes("%%UNSUBSCRIBE%%");
    const batchSize = coreEnv.EMAIL_BATCH_SIZE ?? 100;
    const batchDelay = coreEnv.EMAIL_BATCH_DELAY_MS ?? 1000;
    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        for (const r of batch) {
            const url = unsubscribeUrl(shop, c.id, r);
            let html = baseHtml;
            if (hasPlaceholder) {
                html = baseHtml.replace(/%%UNSUBSCRIBE%%/g, `<a href="${url}">Unsubscribe</a>`);
            }
            else {
                html = `${baseHtml}<p><a href="${url}">Unsubscribe</a></p>`;
            }
            await sendCampaignEmail({
                to: r,
                subject: c.subject,
                html,
            });
            await emitSend(shop, { campaign: c.id });
        }
        if (i + batchSize < recipients.length && batchDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, batchDelay));
        }
    }
    c.sentAt = clock.now().toISOString();
}
export async function listCampaigns(shop) {
    return getCampaignStore().readCampaigns(shop);
}
export async function createCampaign(opts) {
    let { shop, recipients = [], subject, body, segment, sendAt, templateId, } = opts;
    shop = validateShopName(shop);
    if (recipients.length === 0 && segment) {
        recipients = await resolveSegment(shop, segment);
    }
    if (!shop || !subject || !body || recipients.length === 0) {
        throw new Error("Missing fields");
    }
    const id = clock.now().getTime().toString(36);
    const scheduled = sendAt ? new Date(sendAt) : clock.now();
    const campaign = {
        id,
        recipients,
        subject,
        body,
        segment: segment ?? null,
        sendAt: scheduled.toISOString(),
        templateId: templateId ?? null,
    };
    if (scheduled <= clock.now()) {
        await deliverCampaign(shop, campaign);
    }
    const store = getCampaignStore();
    const campaigns = await store.readCampaigns(shop);
    campaigns.push(campaign);
    await store.writeCampaigns(shop, campaigns);
    return id;
}
export async function sendDueCampaigns() {
    const store = getCampaignStore();
    const shops = await store.listShops();
    const now = clock.now();
    for (const shop of shops) {
        const campaigns = await store.readCampaigns(shop);
        let changed = false;
        for (const c of campaigns) {
            if (c.sentAt || new Date(c.sendAt) > now)
                continue;
            await deliverCampaign(shop, c);
            changed = true;
        }
        if (changed)
            await store.writeCampaigns(shop, campaigns);
    }
}
/**
 * Periodically sync campaign analytics for all shops.
 */
export async function syncCampaignAnalytics() {
    await fetchCampaignAnalytics();
}
