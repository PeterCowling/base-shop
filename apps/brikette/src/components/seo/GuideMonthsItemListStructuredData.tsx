/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/GuideMonthsItemListStructuredData.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideAbsoluteUrl } from "@/routes.guides-helpers";

type MonthEntry = { name: string; note: string };

interface Props {
  guideKey: GuideKey;
  name?: string;
  canonicalUrl?: string;
}

function GuideMonthsItemListStructuredData({ guideKey, name, canonicalUrl }: Props): JSX.Element | null {
  const lang = useCurrentLanguage();
  const pathname = usePathname() ?? "";
  const { t, ready } = useTranslation("guides", { lng: lang });

  const json = (() => {
    if (!ready) return "";
    const coerceMonthEntries = (value: unknown): MonthEntry[] => {
      if (!Array.isArray(value)) return [];
      return (value as unknown[]) // sanitize and normalize
        .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
        .filter((o): o is Record<string, unknown> => Boolean(o))
        .map((o) => ({
          name: String(o["name"] ?? "").trim(),
          note: String(o["note"] ?? "").trim(),
        }))
        .filter((m) => m.name.length > 0 && m.note.length > 0);
    };

    // Localized months
    const localRaw = t(`content.${guideKey}.schemaMonths`, { returnObjects: true }) as unknown;
    let months = coerceMonthEntries(localRaw);

    // Fallback to English when no localized entries are available
    if (months.length === 0) {
      try {
        const en = i18n.getFixedT("en", "guides");
        const enRaw = en(`content.${guideKey}.schemaMonths`, { returnObjects: true }) as unknown;
        months = coerceMonthEntries(enRaw);
      } catch {
        months = [];
      }
    }

    if (months.length === 0) return "";

    const url = typeof canonicalUrl === "string" && canonicalUrl.length > 0
      ? canonicalUrl
      : typeof pathname === "string" && pathname.length > 0
      ? `${BASE_URL}${pathname}`
      : guideAbsoluteUrl(lang, guideKey);

    const title = typeof name === "string" && name.trim().length > 0 ? name : "";

    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      inLanguage: lang,
      url,
      name: title,
      itemListElement: months.map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: m.name,
        description: m.note,
      })),
    });
  })();

  if (!json) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(GuideMonthsItemListStructuredData);
