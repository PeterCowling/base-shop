export interface CampaignStats {
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
}
export declare const emptyStats: CampaignStats;
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
/** Normalize SendGrid stats response to the common CampaignStats shape */
export declare function mapSendGridStats(stats: SendGridStatsResponse): CampaignStats;
/** Normalize Resend stats response to the common CampaignStats shape */
export declare function mapResendStats(stats: ResendStatsResponse): CampaignStats;
export declare function normalizeProviderStats(provider: string, stats: SendGridStatsResponse | ResendStatsResponse | undefined): CampaignStats;
//# sourceMappingURL=stats.d.ts.map