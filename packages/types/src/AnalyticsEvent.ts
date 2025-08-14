export type AnalyticsEvent =
  | {
      type: "email_sent" | "email_open" | "email_click";
      campaign: string;
      timestamp?: string;
      [key: string]: unknown;
    }
  | {
      type: "discount_redeemed";
      code: string;
      timestamp?: string;
      [key: string]: unknown;
    }
  | {
      type: string;
      timestamp?: string;
      [key: string]: unknown;
    };
