import { ConfiguratorProvider } from "../ConfiguratorContext";

import StepPage from "./step-page";

interface PageProps {
  params: Promise<{ stepId: string }>;
}

export default async function ConfiguratorStepPage({ params }: PageProps) {
  const { stepId } = await params;
  return (
    <ConfiguratorProvider>
      <StepPage stepId={stepId} />
    </ConfiguratorProvider>
  );
}
