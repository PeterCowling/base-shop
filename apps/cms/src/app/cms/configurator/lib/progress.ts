"use client";

import { type ConfiguratorProgress } from "@acme/platform-core/contexts/LayoutContext";

import { type StepStatus } from "../../wizard/schema";
import { getSteps } from "../steps";

export function calculateConfiguratorProgress(
  completed: Record<string, StepStatus | undefined>
): ConfiguratorProgress {
  const steps = getSteps();
  const required = steps.filter((s) => !s.optional);
  const optional = steps.filter((s) => s.optional);
  const completedRequired = required.filter(
    (s) => completed[s.id] === "complete"
  ).length;
  const completedOptional = optional.filter(
    (s) => completed[s.id] === "complete"
  ).length;
  return {
    completedRequired,
    totalRequired: required.length,
    completedOptional,
    totalOptional: optional.length,
  };
}
