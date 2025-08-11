"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/atoms/shadcn";
import type { WizardState } from "../wizard/schema";
export type StepStatus = "idle" | "pending" | "success" | "failure";

interface StepConfig {
  id: string;
  title: string;
  href: string;
  required?: boolean;
  completed: boolean;
}

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

  const steps: StepConfig[] = [
    {
      id: "details",
      title: "Shop Details",
      href: "/cms/configurator/details",
      required: true,
      completed: Boolean(state?.storeName),
    },
    {
      id: "theme",
      title: "Theme",
      href: "/cms/configurator/theme",
      required: true,
      completed: Boolean(state?.theme),
    },
    {
      id: "products",
      title: "Products",
      href: "/cms/configurator/products",
      required: false,
      completed: (state?.components?.length ?? 0) > 0,
    },
  ];

  const allRequiredDone = steps.every(
    (s) => !s.required || s.completed
  );

  const launchShop = async () => {
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
              {step.title}
            </Link>
          </li>
        ))}
      </ul>
      <Button disabled={!allRequiredDone} onClick={launchShop}>
        Launch Shop
      </Button>
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
    </div>
  );
}

