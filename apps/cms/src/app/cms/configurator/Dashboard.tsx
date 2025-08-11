"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/atoms/shadcn";
import { Toast, Tooltip } from "@/components/atoms";
import { wizardStateSchema, type WizardState } from "../wizard/schema";
import { useWizardPersistence } from "../wizard/hooks/useWizardPersistence";
import {
  getRequiredSteps,
  getSteps,
  steps as configuratorSteps,
  type ConfiguratorStep,
} from "./steps";

const stepLinks: Record<string, string> = {
  create: "summary",
  init: "import-data",
  deploy: "hosting",
  seed: "seed-data",
};
export type StepStatus = "idle" | "pending" | "success" | "failure";

export default function ConfiguratorDashboard() {
  const [state, setState] = useState<WizardState>(wizardStateSchema.parse({}));
  const [launchStatus, setLaunchStatus] = useState<
    Record<string, StepStatus> | null
  >(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    {
      open: false,
      message: "",
    }
  );

  const fetchState = useCallback(() => {
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        setState((prev) => ({ ...prev, ...(json.state ?? json), completed: json.completed ?? {} }));
      })
      .catch(() => setState(wizardStateSchema.parse({})));
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const handler = () => fetchState();
    window.addEventListener("wizard:update", handler);
    return () => window.removeEventListener("wizard:update", handler);
  }, [fetchState]);
  const markStepComplete = useWizardPersistence(state, setState);
  const stepList = useMemo(() => getSteps(), []);
  const missingRequired = getRequiredSteps().filter(
    (s) => state?.completed?.[s.id] !== "complete"
  );
  const allRequiredDone = missingRequired.length === 0;
  const tooltipText = allRequiredDone
    ? "All steps complete"
    : `Complete required steps: ${missingRequired
        .map((s) => s.label)
        .join(", ")}`;

  const skipStep = (stepId: string) => markStepComplete(stepId, "skipped");
  const resetStep = (stepId: string) => markStepComplete(stepId, "pending");

  const handleStepClick = (step: ConfiguratorStep) => (
    e: MouseEvent<HTMLAnchorElement>
  ) => {
    const missing = (step.prerequisites ?? []).filter(
      (id) => !state?.completed?.[id]
    );
    if (missing.length > 0) {
      e.preventDefault();
      setToast({
        open: true,
        message: `Complete prerequisite steps: ${missing
          .map((id) => configuratorSteps[id]?.label ?? id)
          .join(", ")}`,
      });
    }
  };

  const launchShop = async () => {
    if (!state?.shopId) return;
    if (!allRequiredDone) {
      setToast({
        open: true,
        message: `Complete required steps: ${missingRequired
          .map((s) => s.label)
          .join(", ")}`,
      });
      return;
    }
    setLaunchError(null);
    setFailedStep(null);
    const seed = Boolean(state.categoriesText);
    setLaunchStatus({
      create: "pending",
      init: "pending",
      deploy: "pending",
      ...(seed ? { seed: "pending" } : {}),
    });
    const res = await fetch("/cms/api/launch-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: state.shopId, state, seed }),
    });
    if (!res.body) {
      setLaunchError("Launch failed");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        const data = JSON.parse(line.slice(5));
        if (data.step && data.status) {
          setLaunchStatus((prev) => ({ ...(prev || {}), [data.step]: data.status }));
          if (data.status === "failure") {
            setLaunchError(data.error || "Launch failed");
            setFailedStep(data.step);
          }
        }
      }
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Configuration Steps</h2>
      <h3 className="mb-2 font-medium">Required</h3>
      <ul className="mb-6 space-y-2">
        {stepList
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
                    onClick={handleStepClick(step)}
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
      {stepList.some((s) => s.optional) && (
        <>
          <h3 className="mb-2 font-medium">Optional</h3>
          <ul className="mb-6 space-y-2">
            {stepList
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
                        onClick={handleStepClick(step)}
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
      <Tooltip text={tooltipText}>
        <Button onClick={launchShop} disabled={!allRequiredDone}>
          Launch Shop
        </Button>
      </Tooltip>
      {!allRequiredDone && (
        <p className="mt-1 text-xs text-gray-600">
          Complete all required steps before launching.
        </p>
      )}
      {launchStatus && (
        <ul className="mt-4 space-y-1 text-sm">
          {Object.entries(launchStatus).map(([step, status]) => (
            <li key={step}>
              {step}: {status}
            </li>
          ))}
        </ul>
      )}
      {launchError && (
        <p className="mt-2 text-sm text-red-600">
          {launchError}
          {failedStep && stepLinks[failedStep] && (
            <>
              {" "}
              <Link
                href={`/cms/configurator/${stepLinks[failedStep]}`}
                className="underline"
              >
                Review {configuratorSteps[stepLinks[failedStep]].label}
              </Link>{" "}
              and retry.
            </>
          )}
        </p>
      )}
      {toast.open && (
        <Toast
          open={toast.open}
          message={toast.message}
          onClose={() => setToast({ open: false, message: "" })}
        />
      )}
    </div>
  );
}

