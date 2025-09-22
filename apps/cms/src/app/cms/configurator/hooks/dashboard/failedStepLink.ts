import { steps as stepsMap } from "../../steps";
import { stepLinks } from "./stepLinks";
import type { LaunchErrorLink } from "./types";

export function getFailedStepLink(failedStep: string | null): LaunchErrorLink | null {
  if (!failedStep) return null;
  const slug = stepLinks[failedStep];
  if (!slug) return null;
  const step = stepsMap[slug];
  if (!step) return null;
  return { href: `/cms/configurator/${slug}`, label: step.label };
}
