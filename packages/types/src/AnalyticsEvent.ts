export interface AnalyticsEvent {
  type: "email_sent" | "email_open" | "email_click";
  campaign: string;
  [key: string]: unknown;
}

