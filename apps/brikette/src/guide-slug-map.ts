// /src/guide-slug-map.ts
// This file now re-exports the canonical guides slug data and helpers
// from src/guides/slugs to keep legacy imports working.

export { GENERATED_GUIDE_SLUGS } from "./data/generate-guide-slugs";
export {
  GUIDE_KEYS,
  GUIDE_KEYS_WITH_OVERRIDES,
  GUIDE_SLUGS,
  GUIDE_SLUG_OVERRIDES,
  getGuideLinkLabels,
  isPlaceholderGuideLabel,
  type GuideKey,
} from "./guides/slugs";
