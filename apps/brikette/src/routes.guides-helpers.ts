// /src/routes.guides-helpers.ts
// Backward-compatible re-exports from the new canonical module.
export {
  type GuideKey,
  GUIDE_KEYS,
  GUIDE_KEYS_WITH_OVERRIDES as TRANSPORT_LINK_KEYS,
  guideSlug,
  guideHref,
  guideAbsoluteUrl,
  guideNamespace,
  guideComponentPath,
  resolveGuideKeyFromSlug,
} from "./guides/slugs";
