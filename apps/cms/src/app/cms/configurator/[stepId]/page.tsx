"use client";

import steps from "../steps";
import { WizardProvider, useWizard } from "../../wizard/WizardContext";

interface PageProps {
  params: { stepId: string };
}

function StepContent({ stepId }: { stepId: string }) {
  const step = steps.find((s) => s.id === stepId);
  if (!step) {
    return null;
  }
  const StepComponent = step.component as React.ComponentType<any>;
  const { markStepComplete } = useWizard();
  return (
    <StepComponent
      markStepComplete={markStepComplete}
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
