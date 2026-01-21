import "server-only";

export interface CampaignOptions {
    /** Recipient email address */
    to: string;
    /** Email subject line */
    subject: string;
    /** HTML body */
    html?: string;
    /** Optional plain-text body */
    text?: string;
    /** Optional campaign identifier for logging */
    campaignId?: string;
    /** Optional template identifier */
    templateId?: string;
    /** Variables to substitute into the template */
    variables?: Record<string, string>;
    /** Sanitize HTML content before sending. Defaults to true. */
    sanitize?: boolean;
}
/**
 * Send a campaign email using the configured provider.
 * Falls back to Nodemailer when EMAIL_PROVIDER is unset or unrecognized.
 * If the chosen provider fails, alternate providers are attempted. Each
 * provider is retried with exponential backoff when the error is marked as
 * retryable.
 */
export declare function sendCampaignEmail(options: CampaignOptions): Promise<void>;
//# sourceMappingURL=send.d.ts.map