// /src/guide-slug-map.ts
// This file now re-exports the canonical guides slug data and helpers
// from src/guides/slugs to keep legacy imports working.

export { GENERATED_GUIDE_SLUGS } from "./data/generate-guide-slugs";
export {
  getGuideLinkLabels,
  GUIDE_KEYS,
  GUIDE_KEYS_WITH_OVERRIDES,
  GUIDE_SLUG_OVERRIDES,
  GUIDE_SLUGS,
  type GuideKey,
  isPlaceholderGuideLabel,
} from "./guides/slugs";
