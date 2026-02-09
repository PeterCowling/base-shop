// /src/routes.guides-helpers.ts
// Backward-compatible re-exports from the new canonical module.
export {
  GUIDE_KEYS,
  guideAbsoluteUrl,
  guideComponentPath,
  guideHref,
  type GuideKey,
  guideNamespace,
  guidePath,
  guideSlug,
  resolveGuideKeyFromSlug,
  GUIDE_KEYS_WITH_OVERRIDES as TRANSPORT_LINK_KEYS,
} from "./guides/slugs";
