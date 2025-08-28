"use client";

import { ConfiguratorProgress, getSteps, stepIndex, steps } from "../steps";
import { useConfigurator } from "../ConfiguratorContext";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const step = steps[stepId];
  const { state } = useConfigurator();
  if (!step) {
    return null;
  }

  const list = getSteps();
  const idx = stepIndex[stepId] ?? 0;
  const prev = list[idx - 1];
  const next = list[idx + 1];

  const StepComponent =
    step.component as unknown as React.ComponentType<Record<string, unknown>>;

  return (
    <div className="space-y-4">
      <ConfiguratorProgress currentStepId={stepId} completed={state.completed} />
      <StepComponent prevStepId={prev?.id} nextStepId={next?.id} />
    </div>
  );
}
