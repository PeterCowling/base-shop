"use client";

import { steps } from "../steps";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const step = steps[stepId];
  if (!step) {
    return null;
  }

  const StepComponent = step.component as React.ComponentType<any>;

  return <StepComponent />;
}
