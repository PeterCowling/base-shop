import { ConfiguratorProvider } from "../ConfiguratorContext";
import StepPage from "./step-page";

interface PageProps {
  params: { stepId: string };
}

export default function ConfiguratorStepPage({ params }: PageProps) {
  return (
    <ConfiguratorProvider>
      <StepPage stepId={params.stepId} />
    </ConfiguratorProvider>
  );
}
