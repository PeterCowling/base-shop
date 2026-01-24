import { RapidLaunchProvider } from "../RapidLaunchProvider";

import StepPage from "./step-page";

interface PageProps {
  params: Promise<{ stepId: string }>;
}

export default async function RapidLaunchStepPage({ params }: PageProps) {
  const { stepId } = await params;
  return (
    <RapidLaunchProvider>
      <StepPage stepId={stepId} />
    </RapidLaunchProvider>
  );
}
