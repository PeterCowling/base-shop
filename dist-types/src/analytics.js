import { trackEvent } from "@acme/platform-core/analytics";
import { coreEnv } from "@acme/config/env/core";
import { getCampaignStore } from "./storage";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
export const emptyStats = {
    delivered: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
    bounced: 0,
};
/** Map a SendGrid webhook event to the internal analytics format */
export function mapSendGridEvent(ev) {
    const typeMap = {
        delivered: "email_delivered",
        open: "email_open",
        click: "email_click",
        unsubscribe: "email_unsubscribe",
        bounce: "email_bounce",
    };
    const type = typeMap[ev?.event];
    if (!type)
        return null;
    const campaign = Array.isArray(ev?.category) ? ev.category[0] : ev?.category;
    return {
        type,
        campaign: campaign || undefined,
        messageId: ev?.sg_message_id,
        recipient: ev?.email,
    };
}
/** Map a Resend webhook event to the internal analytics format */
export function mapResendEvent(ev) {
    const typeMap = {
        "email.delivered": "email_delivered",
        "email.opened": "email_open",
        "email.clicked": "email_click",
        "email.unsubscribed": "email_unsubscribe",
        "email.bounced": "email_bounce",
    };
    const type = typeMap[ev?.type];
    if (!type)
        return null;
    const data = ev?.data || {};
    const campaign = data.campaign || data.campaign_id;
    return {
        type,
        campaign: campaign || undefined,
        messageId: data.message_id,
        recipient: data.email || data.recipient,
    };
}
/** Normalize SendGrid stats response to the common CampaignStats shape */
export function mapSendGridStats(stats) {
    return {
        delivered: Number(stats?.delivered) || 0,
        opened: Number(stats?.opens ?? stats?.opened) || 0,
        clicked: Number(stats?.clicks ?? stats?.clicked) || 0,
        unsubscribed: Number(stats?.unsubscribes ?? stats?.unsubscribed) || 0,
        bounced: Number(stats?.bounces ?? stats?.bounced) || 0,
    };
}
/** Normalize Resend stats response to the common CampaignStats shape */
export function mapResendStats(stats) {
    return {
        delivered: Number(stats?.delivered ?? stats?.delivered_count) || 0,
        opened: Number(stats?.opened ?? stats?.opened_count) || 0,
        clicked: Number(stats?.clicked ?? stats?.clicked_count) || 0,
        unsubscribed: Number(stats?.unsubscribed ?? stats?.unsubscribed_count) || 0,
        bounced: Number(stats?.bounced ?? stats?.bounced_count) || 0,
    };
}
export function normalizeProviderStats(provider, stats) {
    if (provider === "sendgrid")
        return mapSendGridStats(stats || {});
    if (provider === "resend")
        return mapResendStats(stats || {});
    return { ...emptyStats };
}
const providers = {
    sendgrid: new SendgridProvider(),
    resend: new ResendProvider(),
};
/**
 * Fetch campaign stats from the configured provider and forward them to the
 * platform analytics system. Intended to run on a periodic schedule.
 */
export async function syncCampaignAnalytics() {
    const providerName = coreEnv.EMAIL_PROVIDER ?? "";
    const provider = providers[providerName];
    if (!provider)
        return;
    const store = getCampaignStore();
    const shops = await store.listShops();
    for (const shop of shops) {
        const campaigns = await store.readCampaigns(shop);
        for (const c of campaigns) {
            if (!c.sentAt)
                continue;
            let stats;
            try {
                stats = await provider.getCampaignStats(c.id);
            }
            catch {
                stats = { ...emptyStats };
            }
            await trackEvent(shop, {
                type: "email_campaign_stats",
                campaign: c.id,
                ...stats,
            });
        }
    }
}
