import { getStepsMap } from "../../steps";

import { stepLinks } from "./stepLinks";
import type { LaunchErrorLink } from "./types";

export function getFailedStepLink(failedStep: string | null): LaunchErrorLink | null {
  if (!failedStep) return null;
  const slug = stepLinks[failedStep];
  if (!slug) return null;
  // Build a default (non-localised) step map; caller typically renders within
  // a localised context and uses keys as safe fallbacks when no translator is provided.
  const stepsMap = getStepsMap();
  const step = stepsMap[slug];
  if (!step) return null;
  return { href: `/cms/configurator/${slug}`, label: step.label };
}
