/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/ExperiencesStructuredData.tsx
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { HOTEL_ID, WEBSITE_ID } from "@/utils/schema";

const SECTION_KEYS = ["bar", "hikes", "concierge"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const SECTION_DEFAULTS: Record<SectionKey, { title: string; description: string }> = {
  bar: {
    title: "Sunset terrace bar",
    description:
      "Our clifftop terrace becomes a lounge every evening with spritzes, Campanian wines, and occasional guest DJs.",
  },
  hikes: {
    title: "Guided hikes & day trips",
    description:
      "We help you plan Sentiero degli Dei hikes, shared shuttles, and ferry-connected day trips across the Amalfi Coast.",
  },
  concierge: {
    title: "Always-on digital concierge",
    description:
      "Receive real-time alerts on ferry changes, restaurant openings, and tailored ideas that match your pace and budget.",
  },
};

const FALLBACK_NAME = "Experiences – Terrace Bar, Hikes, Digital Concierge";
const FALLBACK_HERO_DESCRIPTION =
  "Pair your stay with terrace drinks, curated hikes, and a digital concierge that keeps you in the loop before you even arrive.";
const FALLBACK_META_DESCRIPTION =
  "Explore the terrace bar, local hikes and our digital concierge to plan your Amalfi Coast days.";

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isUnresolvedKey(value: string): boolean {
  // Heuristic: identity-translation in tests returns the lookup key
  // e.g. "sections.bar.title" or "meta.title" – treat as missing
  return (
    value === "meta.title" ||
    value === "hero.description" ||
    value === "meta.description" ||
    value.startsWith("sections.")
  );
}

function translateOrFallback(
  t: ReturnType<typeof useTranslation>["t"],
  lang: string,
  key: string,
  fallback: string,
  opts: { treatEmptyAsMissing?: boolean } = {},
): string {
  const { treatEmptyAsMissing = false } = opts;
  const raw = normalize(
    t(key, {
      lng: lang,
      defaultValue: "",
    }),
  );

  if (!raw) {
    return treatEmptyAsMissing ? "" : fallback;
  }

  if (isUnresolvedKey(raw)) {
    return fallback;
  }

  return raw;
}

function ExperiencesStructuredData(): JSX.Element | null {
  const lang = useCurrentLanguage();
  const pathname = usePathname() ?? "";
  const { t, ready } = useTranslation("experiencesPage", { lng: lang });

  const json = useMemo(() => {
    if (!ready) return "";
    const name = translateOrFallback(t, lang, "meta.title", FALLBACK_NAME);
    const primaryDescription = translateOrFallback(t, lang, "hero.description", FALLBACK_HERO_DESCRIPTION, {
      treatEmptyAsMissing: true,
    });
    const fallbackDescription = translateOrFallback(
      t,
      lang,
      "meta.description",
      FALLBACK_META_DESCRIPTION,
      {
        treatEmptyAsMissing: true,
      },
    );
    const description = primaryDescription || fallbackDescription || FALLBACK_META_DESCRIPTION;

    const sections = SECTION_KEYS.map((key, index) => {
      const defaults = SECTION_DEFAULTS[key];
      const title = translateOrFallback(
        t,
        lang,
        `sections.${key as SectionKey}.title`,
        defaults.title,
        { treatEmptyAsMissing: true },
      );
      const body = translateOrFallback(
        t,
        lang,
        `sections.${key as SectionKey}.description`,
        defaults.description,
        { treatEmptyAsMissing: true },
      );
      if (!title || !body) return null;
      return {
        position: index + 1,
        title,
        body,
      };
    }).filter((value): value is { position: number; title: string; body: string } => value !== null);

    if (!name || sections.length === 0) {
      return "";
    }

    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      inLanguage: lang,
      url: `${BASE_URL}${pathname}`,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      name,
      description,
      itemListElement: sections.map((section) => ({
        "@type": "ListItem",
        position: section.position,
        name: section.title,
        description: section.body,
        item: {
          "@type": "Thing",
          name: section.title,
          description: section.body,
        },
      })),
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": HOTEL_ID },
    });
  }, [lang, pathname, t, ready]);

  if (!json) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default memo(ExperiencesStructuredData);
