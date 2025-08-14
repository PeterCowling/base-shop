"use client";

import { orderedSteps, steps, StepProgress } from "../steps";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const step = steps[stepId];
  if (!step) {
    return null;
  }

  const StepComponent = step.component as React.ComponentType<any>;
  const prev = orderedSteps[step.index - 1];
  const next = orderedSteps[step.index + 1];

  return (
    <>
      <StepProgress currentStepId={stepId} />
      <StepComponent previousStepId={prev?.id} nextStepId={next?.id} />
    </>
  );
}
