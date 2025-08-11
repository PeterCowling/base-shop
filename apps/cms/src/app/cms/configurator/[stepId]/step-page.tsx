"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSteps, steps } from "../steps";
import { useWizard } from "../../wizard/WizardContext";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const router = useRouter();
  const { state } = useWizard();
  const stepList = getSteps();
  const index = stepList.findIndex((s) => s.id === stepId);
  const step = stepList[index];
  if (!step) {
    return null;
  }

  const prerequisites = steps[stepId]?.prerequisites ?? [];
  const missingPrereq = prerequisites.find(
    (id) => state.completed[id] !== "complete"
  );

  useEffect(() => {
    if (missingPrereq) {
      router.push(`/cms/configurator/${missingPrereq}`);
    }
  }, [missingPrereq, router]);

  if (missingPrereq) {
    return <div>Please complete prerequisite steps first.</div>;
  }

  const StepComponent = step.component as React.ComponentType<any>;
  const nextId =
    index >= 0 && index < stepList.length - 1 ? stepList[index + 1].id : null;
  const prevId = index > 0 ? stepList[index - 1].id : null;
  const goNext = () => {
    if (nextId) router.push(`/cms/configurator/${nextId}`);
  };
  const goBack = () => {
    if (prevId) router.push(`/cms/configurator/${prevId}`);
  };
  return <StepComponent onNext={goNext} onBack={goBack} />;
}
