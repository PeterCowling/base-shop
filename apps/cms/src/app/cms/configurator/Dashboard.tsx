"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { Button } from "@/components/atoms/shadcn";
import { Toast, Tooltip } from "@/components/atoms";
import { wizardStateSchema, type WizardState } from "../wizard/schema";
import { useConfiguratorPersistence } from "./hooks/useConfiguratorPersistence";
import { useLaunchShop } from "./hooks/useLaunchShop";
import { calculateConfiguratorProgress } from "./lib/progress";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import { getSteps, steps as configuratorSteps } from "./steps";
import ConfiguratorStepList from "./components/ConfiguratorStepList";
import type { ConfiguratorStep } from "./types";

const stepLinks: Record<string, string> = {
  create: "summary",
  init: "import-data",
  deploy: "hosting",
  seed: "seed-data",
};

export default function ConfiguratorDashboard() {
  const [state, setState] = useState<WizardState>(wizardStateSchema.parse({}));
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    {
      open: false,
      message: "",
    }
  );
  const { setConfiguratorProgress } = useLayout();

    const fetchState = useCallback(() => {
      fetch("/cms/api/configurator-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        setState((prev: WizardState) => ({
          ...prev,
          ...(json.state ?? json),
          completed: json.completed ?? {},
        }));
      })
      .catch(() => setState(wizardStateSchema.parse({})));
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const handler = () => fetchState();
    window.addEventListener("configurator:update", handler);
    return () => window.removeEventListener("configurator:update", handler);
  }, [fetchState]);
  const [markStepComplete] = useConfiguratorPersistence(state, setState);
  const stepList = useMemo(() => getSteps(), []);

  useEffect(() => {
    setConfiguratorProgress(calculateConfiguratorProgress(state.completed));
  }, [state.completed, setConfiguratorProgress]);

  useEffect(() => () => setConfiguratorProgress(undefined), [setConfiguratorProgress]);

  const skipStep = (stepId: string) => markStepComplete(stepId, "skipped");
  const resetStep = (stepId: string) => markStepComplete(stepId, "pending");

  const handleStepClick = (step: ConfiguratorStep) => {
    const missing = (step.recommended ?? []).filter(
      (id) => !state?.completed?.[id]
    );
    if (missing.length > 0) {
      setToast({
        open: true,
        message: `Recommended to complete: ${missing
          .map((id) => configuratorSteps[id]?.label ?? id)
          .join(", ")}`,
      });
    }
  };

  const {
    launchShop,
    launchStatus,
    launchError,
    failedStep,
    allRequiredDone,
    tooltipText,
  } = useLaunchShop(state, {
    onIncomplete: (missing) =>
      setToast({
        open: true,
        message: `Complete required steps: ${missing
          .map((s) => s.label)
          .join(", ")}`,
      }),
  });

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Configuration Steps</h2>
      <ConfiguratorStepList
        state={state}
        steps={stepList}
        skipStep={skipStep}
        resetStep={resetStep}
        onStepClick={handleStepClick}
      />
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

