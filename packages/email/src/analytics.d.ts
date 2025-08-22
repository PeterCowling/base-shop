export type EmailEventType = "email_delivered" | "email_open" | "email_click" | "email_unsubscribe" | "email_bounce";
export interface EmailAnalyticsEvent {
    type: EmailEventType;
    campaign?: string;
    messageId?: string;
    recipient?: string;
    [key: string]: unknown;
}
export interface CampaignStats {
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
}
export declare const emptyStats: CampaignStats;
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
/** Stats payload returned from the SendGrid campaigns API. */
export interface SendGridStatsResponse {
    delivered?: number | string;
    opens?: number | string;
    opened?: number | string;
    clicks?: number | string;
    clicked?: number | string;
    unsubscribes?: number | string;
    unsubscribed?: number | string;
    bounces?: number | string;
    bounced?: number | string;
    [key: string]: unknown;
}
/** Stats payload returned from the Resend campaigns API. */
export interface ResendStatsResponse {
    delivered?: number | string;
    delivered_count?: number | string;
    opened?: number | string;
    opened_count?: number | string;
    clicked?: number | string;
    clicked_count?: number | string;
    unsubscribed?: number | string;
    unsubscribed_count?: number | string;
    bounced?: number | string;
    bounced_count?: number | string;
    [key: string]: unknown;
}
/** Map a SendGrid webhook event to the internal analytics format */
export declare function mapSendGridEvent(ev: SendGridWebhookEvent): EmailAnalyticsEvent | null;
/** Map a Resend webhook event to the internal analytics format */
export declare function mapResendEvent(ev: ResendWebhookEvent): EmailAnalyticsEvent | null;
/** Normalize SendGrid stats response to the common CampaignStats shape */
export declare function mapSendGridStats(stats: SendGridStatsResponse): CampaignStats;
/** Normalize Resend stats response to the common CampaignStats shape */
export declare function mapResendStats(stats: ResendStatsResponse): CampaignStats;
export declare function normalizeProviderStats(provider: string, stats: SendGridStatsResponse | ResendStatsResponse | undefined): CampaignStats;
/**
 * Fetch campaign stats from the configured provider and forward them to the
 * platform analytics system. Intended to run on a periodic schedule.
 */
export declare function syncCampaignAnalytics(): Promise<void>;
//# sourceMappingURL=analytics.d.ts.map