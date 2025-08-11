import { WizardProvider } from "../../wizard/WizardContext";
import StepPage from "./step-page";

interface PageProps {
  params: { stepId: string };
}

export default function ConfiguratorStepPage({ params }: PageProps) {
  return (
    <WizardProvider>
      <StepPage stepId={params.stepId} />
    </WizardProvider>
  );
}
