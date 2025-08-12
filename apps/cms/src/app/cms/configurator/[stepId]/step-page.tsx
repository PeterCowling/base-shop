"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { steps } from "../steps";
import { useConfigurator } from "../ConfiguratorContext";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const router = useRouter();
  const { state } = useConfigurator();
  const step = steps[stepId];
  if (!step) {
    return null;
  }

  const prerequisites = step.prerequisites ?? [];
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

  return <StepComponent />;
}
