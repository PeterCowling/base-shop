import type { OgImageConfig } from "./types";

export const OG_TITLE_PROPERTY = "og:title" as const;
export const OG_DESCRIPTION_PROPERTY = "og:description" as const;
export const OG_IMAGE_PROPERTY = "og:image" as const;
export const OG_IMAGE_WIDTH_PROPERTY = "og:image:width" as const;
export const OG_IMAGE_HEIGHT_PROPERTY = "og:image:height" as const;
export const TWITTER_CARD_NAME = "twitter:card" as const;
export const TWITTER_IMAGE_NAME = "twitter:image" as const;
export const TWITTER_TITLE_NAME = "twitter:title" as const;
export const TWITTER_DESCRIPTION_NAME = "twitter:description" as const;
export const HOW_TO_JSON_TYPE = "application/ld+json" as const;

export const DEFAULT_OG_IMAGE: OgImageConfig = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
};

