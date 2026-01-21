import "server-only";

import { trackEvent } from "@acme/platform-core/analytics";

import { ResendProvider } from "./providers/resend";
import { SendgridProvider } from "./providers/sendgrid";
import type { CampaignProvider } from "./providers/types";
import { type CampaignStats,emptyStats } from "./stats";
import { getCampaignStore } from "./storage";

export type {
  CampaignStats,
  ResendStatsResponse,
  SendGridStatsResponse,
} from "./stats";
export {
  emptyStats,
  mapResendStats,
  mapSendGridStats,
  normalizeProviderStats,
} from "./stats";

export type EmailEventType =
  | "email_delivered"
  | "email_open"
  | "email_click"
  | "email_unsubscribe"
  | "email_bounce";

export interface EmailAnalyticsEvent {
  type: EmailEventType;
  campaign?: string;
  messageId?: string;
  recipient?: string;
  [key: string]: unknown;
}

/** Shape of events emitted by the SendGrid webhook. */
export interface SendGridWebhookEvent {
  event: string;
  sg_message_id?: string;
  email?: string;
  category?: string | string[];
  [key: string]: unknown;
}

/** Shape of events emitted by the Resend webhook. */
export interface ResendWebhookEvent {
  type: string;
  data?: {
    message_id?: string;
    email?: string;
    recipient?: string;
    campaign_id?: string;
    campaign?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** Map a SendGrid webhook event to the internal analytics format */
export function mapSendGridEvent(
  ev: SendGridWebhookEvent
): EmailAnalyticsEvent | null {
  const typeMap: Record<string, EmailEventType> = {
    delivered: "email_delivered",
    open: "email_open",
    click: "email_click",
    unsubscribe: "email_unsubscribe",
    bounce: "email_bounce",
  };
  const type = typeMap[ev?.event];
  if (!type) return null;
  const campaign = Array.isArray(ev?.category) ? ev.category[0] : ev?.category;
  const result: EmailAnalyticsEvent = {
    type,
    messageId: ev?.sg_message_id,
    recipient: ev?.email,
  };
  if (campaign) result.campaign = campaign;
  return result;
}

/** Map a Resend webhook event to the internal analytics format */
export function mapResendEvent(
  ev: ResendWebhookEvent
): EmailAnalyticsEvent | null {
  const typeMap: Record<string, EmailEventType> = {
    "email.delivered": "email_delivered",
    "email.opened": "email_open",
    "email.clicked": "email_click",
    "email.unsubscribed": "email_unsubscribe",
    "email.bounced": "email_bounce",
  };
  const type = typeMap[ev?.type];
  if (!type) return null;
  const data = ev?.data || {};
  const campaign = data.campaign || data.campaign_id;
  return {
    type,
    campaign: campaign || undefined,
    messageId: data.message_id,
    recipient: data.email || data.recipient,
  };
}

const providers: Record<string, CampaignProvider> = {
  sendgrid: new SendgridProvider(),
  resend: new ResendProvider(),
};

/**
 * Fetch campaign stats from the configured provider and forward them to the
 * platform analytics system. Intended to run on a periodic schedule.
 */
export async function syncCampaignAnalytics(): Promise<void> {
  const providerName = process.env.EMAIL_PROVIDER ?? "";
  const provider = providers[providerName];
  if (!provider) return;

  const store = getCampaignStore();
  const shops = await store.listShops();
  for (const shop of shops) {
    const campaigns = await store.readCampaigns(shop);
    for (const c of campaigns) {
      if (!c.sentAt) continue;
      let stats: CampaignStats;
      try {
        stats = await provider.getCampaignStats(c.id);
      } catch {
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
