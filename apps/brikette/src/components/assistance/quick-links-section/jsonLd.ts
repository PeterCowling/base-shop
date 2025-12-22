import { BASE_URL } from "@/config/baseUrl";
import type { AppLanguage } from "@/i18n.config";

import type { QuickLinkWithHref } from "./types";

export function buildQuickLinksJsonLd(
  resolvedLang: AppLanguage,
  quickLinks: QuickLinkWithHref[],
): string {
  if (quickLinks.length === 0) {
    return "";
  }

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    inLanguage: resolvedLang,
    itemListElement: quickLinks.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      description: item.description,
      url: `${BASE_URL}${item.href}`,
    })),
  });
}
