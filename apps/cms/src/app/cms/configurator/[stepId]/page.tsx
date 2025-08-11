"use client";

import { getSteps } from "../steps";
import { WizardProvider } from "../../wizard/WizardContext";
import useStepCompletion from "../../wizard/hooks/useStepCompletion";

interface PageProps {
  params: { stepId: string };
}

const steps = getSteps();

function StepContent({ stepId }: { stepId: string }) {
  const step = steps.find((s) => s.id === stepId);
  if (!step) {
    return null;
  }
  const StepComponent = step.component as React.ComponentType<any>;
  const [, setCompleted] = useStepCompletion(step.id);
  return (
    <StepComponent
      onComplete={() => setCompleted(true)}
      onNext={() => {}}
      onBack={() => {}}
    />
  );
}

export default function ConfiguratorStepPage({ params }: PageProps) {
  return (
    <WizardProvider>
      <StepContent stepId={params.stepId} />
    </WizardProvider>
  );
}
