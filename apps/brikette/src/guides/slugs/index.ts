// src/guides/slugs/index.ts
// Canonical helpers and data for guide keys, slugs, namespaces, component paths, and lookups.
// Re-exports single-purpose modules to keep the public API stable.

export type { GuideKey } from "./keys";
export { ENGLISH_SLUGS, GUIDE_KEYS, GUIDE_KEYS_WITH_OVERRIDES } from "./keys";
export { GUIDE_SLUG_OVERRIDES } from "./overrides";
export { GUIDE_SLUGS } from "./slugs";
export { getGuideLinkLabels, isPlaceholderGuideLabel } from "./labels";
export { guideSlug, guideComponentPath, guideHref, guideAbsoluteUrl } from "./urls";
export { GUIDE_SLUG_LOOKUP_BY_LANG } from "./lookups";
export { guideNamespace, GUIDE_BASE_KEY_OVERRIDES, publishedGuideKeysByBase } from "./namespaces";
export { resolveGuideKeyFromSlug } from "./resolve";

