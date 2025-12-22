import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { GUIDE_KEY } from "./path-of-the-gods.constants";

type HowToOptions = { guideKey?: string; totalTime?: string };

const DEFAULT_TOTAL_TIME = "PT4H" as const;

export function createPathOfTheGodsHowToSteps(
  context: GuideSeoTemplateContext,
  options: HowToOptions = {},
): { steps: { name: string; text?: string }[]; extras: { totalTime: string } } {
  const guideKey = options.guideKey ?? GUIDE_KEY;
  const totalTime = options.totalTime ?? DEFAULT_TOTAL_TIME;

  const stepsRaw = context.translateGuides(`content.${guideKey}.steps`, { returnObjects: true });
  const steps = ensureArray<{ name?: string; text?: unknown }>(stepsRaw)
    .map((step) => {
      const name = typeof step?.name === "string" ? step.name.trim() : "";
      if (!name) return null;
      const text = ensureStringArray(step?.text)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .join(" ");
      return text.length > 0 ? { name, text } : { name };
    })
    .filter((entry): entry is { name: string; text?: string } => entry != null);

  return {
    steps,
    extras: { totalTime },
  };
}
