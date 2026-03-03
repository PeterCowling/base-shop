// src/components/seo/ExperiencesStructuredDataRsc.tsx
import "server-only";

/* ─────────────────────────────────────────────────────────────
   ExperiencesStructuredDataRsc
   -------------------------------------------------------------
   Server-only RSC variant of ExperiencesStructuredData.
   Emits an <ItemList> JSON-LD block directly in the initial HTML
   response. Translations are resolved server-side via
   getTranslations — no useTranslation hook, no !ready guard,
   no suppressHydrationWarning required.
---------------------------------------------------------------- */
import type { TFunction } from "i18next";

import { buildCanonicalUrl } from "@acme/ui/lib/seo";

import { getTranslations } from "@/app/_lib/i18n-server";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { HOTEL_ID, WEBSITE_ID } from "@/utils/schema";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";
import { getSlug } from "@/utils/slug";

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
  t: TFunction,
  key: string,
  fallback: string,
  opts: { treatEmptyAsMissing?: boolean } = {},
): string {
  const { treatEmptyAsMissing = false } = opts;
  const raw = normalize(
    t(key, {
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

interface ExperiencesStructuredDataRscProps {
  lang: AppLanguage;
}

export default async function ExperiencesStructuredDataRsc({
  lang,
}: ExperiencesStructuredDataRscProps): Promise<JSX.Element | null> {
  const t = await getTranslations(lang, "experiencesPage");
  const pathname = `/${lang}/${getSlug("experiences", lang)}`;

  const name = translateOrFallback(t, "meta.title", FALLBACK_NAME);
  const primaryDescription = translateOrFallback(t, "hero.description", FALLBACK_HERO_DESCRIPTION, {
    treatEmptyAsMissing: true,
  });
  const fallbackDescription = translateOrFallback(
    t,
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
      `sections.${key as SectionKey}.title`,
      defaults.title,
      { treatEmptyAsMissing: true },
    );
    const body = translateOrFallback(
      t,
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
    return null;
  }

  const json = serializeJsonLdValue({
    "@context": "https://schema.org",
    "@type": "ItemList",
    inLanguage: lang,
    url: buildCanonicalUrl(BASE_URL, pathname),
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
