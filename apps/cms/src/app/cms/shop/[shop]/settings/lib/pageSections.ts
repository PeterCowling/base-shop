import type { Locale } from "@acme/types";

export type ServiceEditorLink = {
  href: string;
  name: string;
  description: string;
};

export function buildServiceEditors(shop: string): ServiceEditorLink[] {
  return [
    {
      href: `/cms/shop/${shop}/settings/seo`,
      name: "Search & discovery",
      description:
        "Tune metadata, AI catalog feeds, and sitemap refreshes so discovery flows stay current.",
    },
    {
      href: `/cms/shop/${shop}/settings/premier-delivery`,
      name: "Premier delivery",
      description:
        "Coordinate concierge shipping windows powered by the premier shipping plugin.",
    },
    {
      href: `/cms/shop/${shop}/settings/deposits`,
      name: "Deposit release",
      description:
        "Control the automated deposit refund cadence for rental orders.",
    },
    {
      href: `/cms/shop/${shop}/settings/returns`,
      name: "Returns",
      description:
        "Toggle carrier labels and return handling for inbound shipments.",
    },
    {
      href: `/cms/shop/${shop}/settings/reverse-logistics`,
      name: "Reverse logistics",
      description:
        "Schedule event ingestion to track cleaning, repair, QA, and ready statuses.",
    },
    {
      href: `/cms/shop/${shop}/settings/stock-alerts`,
      name: "Stock alerts",
      description:
        "Set thresholds, recipients, and webhooks for low stock notifications.",
    },
    {
      href: `/cms/shop/${shop}/settings/stock-scheduler`,
      name: "Stock scheduler",
      description:
        "Adjust background stock checks to avoid overlapping intervals.",
    },
    {
      href: `/cms/shop/${shop}/settings/maintenance-scan`,
      name: "Maintenance scan",
      description:
        "Define how often maintenance scans run to keep catalog metadata healthy.",
    },
  ];
}

export type SnapshotItem = {
  label: string;
  value: string;
};

export function buildSnapshotItems({
  languages,
  currency,
  taxRegion,
  themeId,
}: {
  languages: Locale[];
  currency?: string | null;
  taxRegion?: string | null;
  themeId?: string | null;
}): SnapshotItem[] {
  const formattedLanguages = languages.length
    ? languages.map((locale) => locale.toUpperCase()).join(", ")
    : "Not configured";

  return [
    {
      label: "Languages",
      value: formattedLanguages,
    },
    {
      label: "Currency",
      value: currency || "Not set",
    },
    {
      label: "Tax region",
      value: taxRegion || "Not set",
    },
    {
      label: "Theme preset",
      value: themeId ?? "Not set",
    },
  ];
}

export interface ThemeTokenRow {
  token: string;
  defaultValue?: string;
  overrideValue?: string;
  hasOverride: boolean;
  changed: boolean;
}

export function mapThemeTokenRows(
  defaults: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
): ThemeTokenRow[] {
  const tokens = Array.from(
    new Set([...Object.keys(defaults ?? {}), ...Object.keys(overrides ?? {})]),
  );

  return tokens
    .sort((a, b) => a.localeCompare(b))
    .map((token) => {
      const defaultValue = defaults?.[token];
      const overrideValue = overrides?.[token];
      const hasOverride = overrideValue !== undefined && overrideValue !== null;
      const changed = hasOverride && overrideValue !== defaultValue;
      return {
        token,
        defaultValue,
        overrideValue,
        hasOverride,
        changed,
      } satisfies ThemeTokenRow;
    });
}
