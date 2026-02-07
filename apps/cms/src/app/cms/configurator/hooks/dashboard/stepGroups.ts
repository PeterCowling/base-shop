import type { ConfiguratorStep } from "../../types";

import type { CompletedState, StepGroupInfo } from "./types";

export function computeStepGroups(
  steps: ConfiguratorStep[],
  completed: CompletedState,
): StepGroupInfo {
  const requiredSteps = steps.filter((step) => !step.optional);
  const optionalSteps = steps.filter((step) => step.optional);

  const requiredCompleted = requiredSteps.filter(
    (step) => completed?.[step.id] === "complete",
  ).length;
  const optionalCompleted = optionalSteps.filter(
    (step) => completed?.[step.id] === "complete",
  ).length;
  const skippedOptional = optionalSteps.filter(
    (step) => completed?.[step.id] === "skipped",
  ).length;

  const progressPercent = requiredSteps.length
    ? Math.round((requiredCompleted / requiredSteps.length) * 100)
    : 0;

  const nextStep = requiredSteps.find((step) => completed?.[step.id] !== "complete");

  return {
    requiredSteps,
    optionalSteps,
    requiredCompleted,
    optionalCompleted,
    skippedOptional,
    progressPercent,
    nextStep,
  };
}
