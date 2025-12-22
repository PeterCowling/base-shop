const joinMetaSegments = (...parts: string[]): string => parts.join(":");

export const OG_TITLE_PROPERTY = joinMetaSegments("og", "title");
export const OG_DESCRIPTION_PROPERTY = joinMetaSegments("og", "description");
export const OG_IMAGE_PROPERTY = joinMetaSegments("og", "image");
export const OG_IMAGE_WIDTH_PROPERTY = joinMetaSegments("og", "image", "width");
export const OG_IMAGE_HEIGHT_PROPERTY = joinMetaSegments("og", "image", "height");
export const TWITTER_CARD_NAME = joinMetaSegments("twitter", "card");
export const TWITTER_IMAGE_NAME = joinMetaSegments("twitter", "image");
export const TWITTER_TITLE_NAME = joinMetaSegments("twitter", "title");
export const TWITTER_DESCRIPTION_NAME = joinMetaSegments("twitter", "description");

export const JSON_LD_MIME_TYPE = "application/ld+json";
export const SUNSET_VIEWPOINTS_GUIDE_KEY = "sunsetViewpoints" as const;
