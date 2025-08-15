export type AnalyticsEvent =
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
      email?: string;
      segment?: string;
      timestamp?: string;
      [key: string]: unknown;
    };
