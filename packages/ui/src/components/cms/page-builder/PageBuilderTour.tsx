"use client";

import { useEffect } from "react";

export interface Step {
  target: string;
  content: string;
}

export const STATUS = {
  FINISHED: "finished",
  SKIPPED: "skipped",
} as const;

export interface CallBackProps {
  status: (typeof STATUS)[keyof typeof STATUS];
}

function Joyride({
  steps: _steps,
  run,
  callback,
}: {
  steps: Step[];
  run?: boolean;
  continuous?: boolean;
  showSkipButton?: boolean;
  callback?: (data: CallBackProps) => void;
  styles?: { options?: { zIndex?: number } };
}) {
  useEffect(() => {
    if (run) {
      callback?.({ status: STATUS.FINISHED });
    }
  }, [run, callback]);

  return null;
}

interface PageBuilderTourProps {
  steps: Step[];
  run: boolean;
  callback: (data: CallBackProps) => void;
}

export default function PageBuilderTour({ steps, run, callback }: PageBuilderTourProps) {
  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      callback={callback}
      styles={{ options: { zIndex: 10000 } }}
    />
  );
}

