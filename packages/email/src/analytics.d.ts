import "server-only";

export type { CampaignStats, ResendStatsResponse,SendGridStatsResponse,  } from "./stats";
export { emptyStats,mapResendStats, mapSendGridStats, normalizeProviderStats,  } from "./stats";
export type EmailEventType = "email_delivered" | "email_open" | "email_click" | "email_unsubscribe" | "email_bounce";
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
export declare function mapSendGridEvent(ev: SendGridWebhookEvent): EmailAnalyticsEvent | null;
/** Map a Resend webhook event to the internal analytics format */
export declare function mapResendEvent(ev: ResendWebhookEvent): EmailAnalyticsEvent | null;
/**
 * Fetch campaign stats from the configured provider and forward them to the
 * platform analytics system. Intended to run on a periodic schedule.
 */
export declare function syncCampaignAnalytics(): Promise<void>;
//# sourceMappingURL=analytics.d.ts.map