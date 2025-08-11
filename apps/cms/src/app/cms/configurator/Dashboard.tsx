"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/atoms/shadcn";
import { Toast, Tooltip } from "@/components/atoms";
import type { WizardState } from "../wizard/schema";
import { getRequiredSteps, getSteps } from "./steps";
export type StepStatus = "idle" | "pending" | "success" | "failure";

export default function ConfiguratorDashboard() {
  const [state, setState] = useState<WizardState | null>(null);
  const [launchStatus, setLaunchStatus] = useState<
    | {
        create: StepStatus;
        init: StepStatus;
        deploy: StepStatus;
        seed?: StepStatus;
      }
    | null
  >(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    {
      open: false,
      message: "",
    }
  );

  useEffect(() => {
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setState(json))
      .catch(() => setState(null));
  }, []);
  const stepList = getSteps();
  const missingRequired = getRequiredSteps().filter(
    (s) => !state?.completed?.[s.id]
  );
  const allRequiredDone = missingRequired.length === 0;

  const skipStep = async (id: string) => {
    setState((prev) =>
      prev ? { ...prev, completed: { ...prev.completed, [id]: true } } : prev
    );
    await fetch("/cms/api/wizard-progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId: id, completed: true }),
    }).catch(() => {
      /* ignore */
    });
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
    const seed = Boolean(state.categoriesText);
    setLaunchStatus({
      create: "pending",
      init: "pending",
      deploy: "pending",
      ...(seed ? { seed: "pending" as StepStatus } : {}),
    });
    const res = await fetch("/cms/api/launch-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: state.shopId, state, seed }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      statuses?: Record<string, StepStatus>;
      error?: string;
    };
    if (json.statuses) {
      setLaunchStatus(json.statuses as any);
    }
    if (!res.ok) {
      setLaunchError(json.error ?? "Launch failed");
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Configuration Steps</h2>
      <ul className="mb-6 space-y-2">
        {stepList.map((step) => {
          const completed = Boolean(state?.completed?.[step.id]);
          return (
            <li key={step.id} className="flex items-center gap-2">
              {completed ? (
                <CheckCircledIcon className="h-4 w-4 text-green-600" />
              ) : (
                <CircleIcon className="h-4 w-4 text-gray-400" />
              )}
              <Link href={`/cms/configurator/${step.id}`} className="underline">
                {step.label}
              </Link>
              {step.optional && (
                <span className="text-xs text-gray-500">(Optional)</span>
              )}
              {step.optional && !completed && (
                <button
                  onClick={() => skipStep(step.id)}
                  className="text-xs text-blue-600 underline"
                >
                  Skip
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {allRequiredDone ? (
        <Button onClick={launchShop}>Launch Shop</Button>
      ) : (
        <Tooltip
          text={`Complete required steps: ${missingRequired
            .map((s) => s.label)
            .join(", ")}`}
        >
          <Button disabled>Launch Shop</Button>
        </Tooltip>
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
        <p className="mt-2 text-sm text-red-600">{launchError}</p>
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

