"use client";

import { useRouter } from "next/navigation";
import { steps, getSteps } from "../steps";
import useStepCompletion from "../../wizard/hooks/useStepCompletion";

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
  const [, setCompleted] = useStepCompletion(stepId);
  const ordered = getSteps();
  const index = ordered.findIndex((s) => s.id === stepId);
  const nextId = index >= 0 && index < ordered.length - 1 ? ordered[index + 1].id : null;
  const prevId = index > 0 ? ordered[index - 1].id : null;
  const goNext = () => {
    if (nextId) router.push(`/cms/configurator/${nextId}`);
  };
  const goBack = () => {
    if (prevId) router.push(`/cms/configurator/${prevId}`);
  };
  return (
    <StepComponent onComplete={() => setCompleted(true)} onNext={goNext} onBack={goBack} />
  );
}
