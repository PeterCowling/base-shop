export type AnalyticsEvent =
  | {
      type: "email_sent" | "email_open" | "email_click";
      campaign: string;
      email?: string;
      segment?: string;
      timestamp?: string;
      [key: string]: unknown;
    }
  | {
      type: "discount_redeemed";
      code: string;
      email?: string;
      segment?: string;
      timestamp?: string;
      [key: string]: unknown;
    }
  | {
      type: string;
      campaign?: string;
      email?: string;
      segment?: string;
      timestamp?: string;
      [key: string]: unknown;
    };
