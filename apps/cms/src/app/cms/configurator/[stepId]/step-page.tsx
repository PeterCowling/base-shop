"use client";

import { useRouter } from "next/navigation";
import { getSteps } from "../steps";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const router = useRouter();
  const steps = getSteps();
  const index = steps.findIndex((s) => s.id === stepId);
  const step = index >= 0 ? steps[index] : null;
  if (!step) {
    return null;
  }
  const StepComponent = step.component as React.ComponentType<any>;
  const nextId = index >= 0 && index < steps.length - 1 ? steps[index + 1].id : null;
  const prevId = index > 0 ? steps[index - 1].id : null;
  const goNext = () => {
    if (nextId) router.push(`/cms/configurator/${nextId}`);
  };
  const goBack = () => {
    if (prevId) router.push(`/cms/configurator/${prevId}`);
  };
  return <StepComponent onNext={goNext} onBack={goBack} />;
}
