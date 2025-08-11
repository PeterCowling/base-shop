"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/atoms/shadcn";
import { Toast, Tooltip } from "@/components/atoms";
import { steps as stepsRegistry, stepOrder } from "./steps";
import type { WizardState } from "../wizard/schema";
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

  useEffect(() => {
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setState(json))
      .catch(() => setState(null));
  }, []);

  const steps = stepOrder.map((id) => {
    const step = stepsRegistry[id];
    return {
      ...step,
      href: `/cms/configurator/${id}`,
      completed: Boolean(state?.completed?.[id]),
    };
  });

  const missingRequired = steps.filter(
    (s) => s.required && !s.completed
  );
  const allRequiredDone = missingRequired.length === 0;
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const launchShop = async () => {
    if (!allRequiredDone) {
      setToast({
        open: true,
        message: `Missing required steps: ${missingRequired
          .map((s) => s.label)
          .join(", ")}`,
      });
      return;
    }
    if (!state?.shopId) return;
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
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2">
            {step.completed ? (
              <CheckCircledIcon className="h-4 w-4 text-green-600" />
            ) : (
              <CircleIcon className="h-4 w-4 text-gray-400" />
            )}
            <Link href={step.href} className="underline">
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
      {allRequiredDone ? (
        <Button onClick={launchShop}>Launch Shop</Button>
      ) : (
        <Tooltip
          text={`Complete required steps: ${missingRequired
            .map((s) => s.label)
            .join(", ")}`}
        >
          <span>
            <Button disabled>Launch Shop</Button>
          </span>
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
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </div>
  );
}

