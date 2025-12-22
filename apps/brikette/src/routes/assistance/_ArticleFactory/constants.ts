// src/routes/assistance/_ArticleFactory/constants.ts

export const OG_IMAGE_DIMENSIONS = { width: 1200, height: 630 } as const;

export const OG_IMAGE_TRANSFORM = {
  width: OG_IMAGE_DIMENSIONS.width,
  height: OG_IMAGE_DIMENSIONS.height,
  quality: 85,
  format: "auto",
} as const;

// i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata value
export const DEFAULT_TWITTER_CARD = "summary_large_image" as const;

export const OPTIONAL_NAMESPACES = ["assistanceCommon", "guides", "translation"] as const;

