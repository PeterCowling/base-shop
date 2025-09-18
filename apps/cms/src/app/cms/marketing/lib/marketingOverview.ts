export type MarketingTool = {
  title: string;
  description: string;
  helper: string;
  actionLabel: string;
  href: string;
};

export function formatPercent(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export const marketingTools: MarketingTool[] = [
  {
    title: "Email automations",
    description:
      "Design campaign flows, apply templates, and preview content before scheduling delivery.",
    helper:
      "Use segments to personalise copy and automatically include unsubscribe links in every send.",
    actionLabel: "Open email composer",
    href: "/cms/marketing/email",
  },
  {
    title: "Discount programs",
    description:
      "Create stackable codes, toggle availability, and monitor redemptions directly from analytics.",
    helper:
      "Codes sync to storefront checkout within a minute and respect scheduling windows by default.",
    actionLabel: "Manage discounts",
    href: "/cms/marketing/discounts",
  },
  {
    title: "Audience segments",
    description:
      "Group customers by behaviour, channel, or metadata and reuse segments across campaigns.",
    helper:
      "Segments update nightly from analytics events and can be previewed from the dashboard view.",
    actionLabel: "Build segments",
    href: "/cms/segments",
  },
];
