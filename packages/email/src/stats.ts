export interface CampaignStats {
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
}

export const emptyStats: CampaignStats = {
  delivered: 0,
  opened: 0,
  clicked: 0,
  unsubscribed: 0,
  bounced: 0,
};

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
export function mapSendGridStats(
  stats: SendGridStatsResponse
): CampaignStats {
  return {
    delivered: Number(stats?.delivered) || 0,
    opened: Number(stats?.opens ?? stats?.opened) || 0,
    clicked: Number(stats?.clicks ?? stats?.clicked) || 0,
    unsubscribed: Number(stats?.unsubscribes ?? stats?.unsubscribed) || 0,
    bounced: Number(stats?.bounces ?? stats?.bounced) || 0,
  };
}

/** Normalize Resend stats response to the common CampaignStats shape */
export function mapResendStats(
  stats: ResendStatsResponse
): CampaignStats {
  return {
    delivered: Number(stats?.delivered ?? stats?.delivered_count) || 0,
    opened: Number(stats?.opened ?? stats?.opened_count) || 0,
    clicked: Number(stats?.clicked ?? stats?.clicked_count) || 0,
    unsubscribed:
      Number(stats?.unsubscribed ?? stats?.unsubscribed_count) || 0,
    bounced: Number(stats?.bounced ?? stats?.bounced_count) || 0,
  };
}

export function normalizeProviderStats(
  provider: string,
  stats: SendGridStatsResponse | ResendStatsResponse | undefined
): CampaignStats {
  if (provider === "sendgrid") return mapSendGridStats(stats || {});
  if (provider === "resend") return mapResendStats(stats || {});
  return { ...emptyStats };
}
