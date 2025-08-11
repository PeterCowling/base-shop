"use client";

import { useRouter } from "next/navigation";
import { getSteps } from "../steps";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const router = useRouter();
  const stepList = getSteps();
  const index = stepList.findIndex((s) => s.id === stepId);
  const step = stepList[index];
  if (!step) {
    return null;
  }
  const StepComponent = step.component as React.ComponentType<any>;
  const nextId = index >= 0 && index < stepList.length - 1 ? stepList[index + 1].id : null;
  const prevId = index > 0 ? stepList[index - 1].id : null;
  const goNext = () => {
    if (nextId) router.push(`/cms/configurator/${nextId}`);
  };
  const goBack = () => {
    if (prevId) router.push(`/cms/configurator/${prevId}`);
  };
  return <StepComponent onNext={goNext} onBack={goBack} />;
}
