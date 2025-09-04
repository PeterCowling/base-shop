// apps/cms/src/app/cms/configurator/components/ConfiguratorStepList.tsx
"use client";

import Link from "next/link";
import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";
import type { ConfiguratorState } from "../../wizard/schema";
import type { ConfiguratorStep } from "../types";

interface Props {
  state: ConfiguratorState;
  steps: ConfiguratorStep[];
  skipStep: (id: string) => void;
  resetStep: (id: string) => void;
  onStepClick: (step: ConfiguratorStep) => void;
}

export function ConfiguratorStepList({
  state,
  steps,
  skipStep,
  resetStep,
  onStepClick,
}: Props): React.JSX.Element {
  return (
    <>
      <h3 className="mb-2 font-medium">Required</h3>
      <ul className="mb-6 space-y-2">
        {steps
          .filter((s) => !s.optional)
          .map((step) => {
            const status = state?.completed?.[step.id];
            const completed = status === "complete";
            return (
              <li key={step.id} className="flex items-center gap-2">
                {completed ? (
                  <CheckCircledIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <CircleIcon className="h-4 w-4 text-gray-400" />
                )}
                <div className="flex items-center gap-1">
                  <Link
                    href={`/cms/configurator/${step.id}`}
                    className="underline"
                    onClick={() => onStepClick(step)}
                  >
                    {step.label}
                  </Link>
                </div>
                <span className="text-xs text-gray-500">
                  {completed ? "Done" : "Pending"}
                </span>
                {completed && (
                  <button
                    type="button"
                    onClick={() => resetStep(step.id)}
                    className="text-xs underline"
                  >
                    Reset
                  </button>
                )}
              </li>
            );
          })}
      </ul>
      {steps.some((s) => s.optional) && (
        <>
          <h3 className="mb-2 font-medium">Optional</h3>
          <ul className="mb-6 space-y-2">
            {steps
              .filter((s) => s.optional)
              .map((step) => {
                const status = state?.completed?.[step.id];
                const completed = status === "complete";
                const skipped = status === "skipped";
                return (
                  <li key={step.id} className="flex items-center gap-2">
                    {completed ? (
                      <CheckCircledIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <CircleIcon className="h-4 w-4 text-gray-400" />
                    )}
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/cms/configurator/${step.id}`}
                        className="underline"
                        onClick={() => onStepClick(step)}
                      >
                        {step.label}
                      </Link>
                      <span className="text-xs italic text-gray-500">
                        (Optional)
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {completed ? "Done" : skipped ? "Skipped" : "Pending"}
                    </span>
                    {completed || skipped ? (
                      <button
                        type="button"
                        onClick={() => resetStep(step.id)}
                        className="text-xs underline"
                      >
                        Reset
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => skipStep(step.id)}
                        className="text-xs underline"
                      >
                        Skip
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>
        </>
      )}
    </>
  );
}

export default ConfiguratorStepList;

