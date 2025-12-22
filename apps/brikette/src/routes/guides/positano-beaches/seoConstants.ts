import type { GuideKey } from "@/routes.guides-helpers";

export const META_DESCRIPTION_NAME = "description" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata attribute
export const OG_TITLE_PROPERTY = "og:title" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata attribute
export const OG_DESCRIPTION_PROPERTY = "og:description" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata attribute
export const OG_IMAGE_PROPERTY = "og:image" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata attribute
export const OG_IMAGE_WIDTH_PROPERTY = "og:image:width" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata attribute
export const OG_IMAGE_HEIGHT_PROPERTY = "og:image:height" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata attribute
export const OG_IMAGE_WIDTH_VALUE = "1200" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata value
export const OG_IMAGE_HEIGHT_VALUE = "630" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata value
export const TWITTER_CARD_NAME = "twitter:card" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata attribute
export const TWITTER_CARD_TYPE = "summary_large_image" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata value
export const TWITTER_IMAGE_NAME = "twitter:image" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata attribute
export const TWITTER_TITLE_NAME = "twitter:title" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata attribute
export const TWITTER_DESCRIPTION_NAME = "twitter:description" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata attribute
export const JSON_LD_MIME_TYPE = "application/ld+json" as const; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata value
export const GUIDE_KEY = "positanoBeaches" satisfies GuideKey;
export const GUIDE_SLUG = "positano-beaches" as const;
export const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;
