"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/atoms/shadcn";
import type { WizardState } from "../wizard/schema";
import { createShop } from "../wizard/services/createShop";
import { initShop } from "../wizard/services/initShop";
import { deployShop } from "../wizard/services/deployShop";
import { getSteps } from "./steps";

interface StepConfig {
  id: string;
  title: string;
  href: string;
  required?: boolean;
  completed: boolean;
}

export default function ConfiguratorDashboard() {
  const [state, setState] = useState<WizardState | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        setState(json?.state ?? null);
        setCompleted(json?.completed ?? {});
      })
      .catch(() => {
        setState(null);
        setCompleted({});
      });
  }, []);

  const steps: StepConfig[] = getSteps().map((step) => ({
    id: step.id,
    title: step.label,
    href: `/cms/configurator/${step.id}`,
    required: step.required,
    completed: Boolean(completed[step.id]),
  }));

  const allRequiredDone = steps.every(
    (s) => !s.required || s.completed
  );

  const launchShop = async () => {
    if (!state?.shopId) return;
    const createRes = await createShop(state.shopId, state);
    if (!createRes.ok) {
      return;
    }
    await initShop(state.shopId, undefined, state.categoriesText);
    await deployShop(state.shopId, state.domain ?? "");
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
    </div>
  );
}

