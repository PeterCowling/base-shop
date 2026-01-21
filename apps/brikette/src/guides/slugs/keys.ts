import { GENERATED_GUIDE_SLUGS } from "../../data/generate-guide-slugs";

import { GUIDE_SLUG_OVERRIDES } from "./overrides";

// Baseline English slugs generated from content/manifest
export const ENGLISH_SLUGS = GENERATED_GUIDE_SLUGS;

// Guide key type strictly from the generated manifest
export type GuideKey = (keyof typeof ENGLISH_SLUGS) & string;

const GENERATED_KEYS = Object.keys(ENGLISH_SLUGS) as GuideKey[];
const OVERRIDE_KEYS = Object.keys(GUIDE_SLUG_OVERRIDES) as GuideKey[];

export const GUIDE_KEYS = Object.freeze(GENERATED_KEYS as GuideKey[]);
export const GUIDE_KEYS_WITH_OVERRIDES = Object.freeze(
  Array.from(new Set<GuideKey>([...GENERATED_KEYS, ...OVERRIDE_KEYS])) as GuideKey[],
);

