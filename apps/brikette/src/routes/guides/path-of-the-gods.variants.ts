// src/routes/guides/path-of-the-gods.variants.ts
import type { GuideKey } from "@/routes.guides-helpers";

export type PathOfTheGodsVariantKey = "bus" | "ferry" | "nocelle";

type VariantConfig = {
  guideKey: GuideKey;
  totalTime: string;
};

export const PATH_OF_THE_GODS_VARIANTS: Record<PathOfTheGodsVariantKey, VariantConfig> = {
  bus: {
    guideKey: "pathOfTheGodsBus" satisfies GuideKey,
    totalTime: "PT5H",
  },
  ferry: {
    guideKey: "pathOfTheGodsFerry" satisfies GuideKey,
    totalTime: "PT6H",
  },
  nocelle: {
    guideKey: "pathOfTheGodsNocelle" satisfies GuideKey,
    totalTime: "PT4H",
  },
} as const;

export function getPathOfTheGodsVariant(key: PathOfTheGodsVariantKey): VariantConfig {
  return PATH_OF_THE_GODS_VARIANTS[key];
}
