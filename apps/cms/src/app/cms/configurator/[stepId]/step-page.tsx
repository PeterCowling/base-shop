"use client";

import { useRouter } from "next/navigation";
import { steps, stepOrder } from "../steps";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const router = useRouter();
  const step = steps[stepId];
  if (!step) {
    return null;
  }
  const StepComponent = step.component as React.ComponentType<any>;
  const index = stepOrder.indexOf(stepId);
  const nextId = index >= 0 && index < stepOrder.length - 1 ? stepOrder[index + 1] : null;
  const prevId = index > 0 ? stepOrder[index - 1] : null;
  const goNext = () => {
    if (nextId) router.push(`/cms/configurator/${nextId}`);
  };
  const goBack = () => {
    if (prevId) router.push(`/cms/configurator/${prevId}`);
  };
  return <StepComponent onNext={goNext} onBack={goBack} />;
}
