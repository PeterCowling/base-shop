/* src/routes/experiences/constants.ts */
import type { SectionMediaEntry } from "./types";

export const SECTION_KEYS = ["bar", "hikes", "concierge"] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const META_DESCRIPTION_NAME = "description" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Standard metadata tokens
export const OG_TITLE_PROPERTY = "og:title" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Standard metadata tokens
export const OG_DESCRIPTION_PROPERTY = "og:description" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Standard metadata tokens
export const OG_LOCALE_PROPERTY = "og:locale" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Standard metadata tokens
export const OG_LOCALE_ALTERNATE_PROPERTY = "og:locale:alternate" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Standard metadata tokens
export const FAQ_HEADING_ID = "experiences-faq" as const; // i18n-exempt -- ROUTES-221 [ttl=2026-12-31] Stable anchor for FAQ section
export const CTA_HEADING_ID = "experiences-cta" as const; // i18n-exempt -- ROUTES-221 [ttl=2026-12-31] Stable anchor for CTA section

export const SECTION_MEDIA: Record<SectionKey, SectionMediaEntry> = {
  bar: { image: "/img/terrace.avif" },
  hikes: { image: "/img/positano-panorama.avif" },
  concierge: { image: "/img/hostel-coastal-horizon.webp" },
};

export const JSON_LD_MIME_TYPE = "application/ld+json" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Structured data MIME type
