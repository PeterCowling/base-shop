"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/atoms/shadcn";
import { Toast, Tooltip } from "@/components/atoms";
import type { WizardState } from "../wizard/schema";
import { createShop } from "../wizard/services/createShop";
import { initShop } from "../wizard/services/initShop";
import { deployShop } from "../wizard/services/deployShop";
import { steps as stepRegistry, stepOrder } from "./steps";

interface StepConfig {
  id: string;
  title: string;
  href: string;
  required: boolean;
  completed: boolean;
}

export default function ConfiguratorDashboard() {
  const [state, setState] = useState<WizardState | null>(null);

  useEffect(() => {
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setState(json))
      .catch(() => setState(null));
  }, []);

  const steps: StepConfig[] = stepOrder.map((id) => ({
    id,
    title: stepRegistry[id].label,
    href: `/cms/configurator/${id}`,
    required: stepRegistry[id].required,
    completed: Boolean(state?.completed?.[id]),
  }));

  const allRequiredDone = stepOrder.every(
    (id) => !stepRegistry[id].required || state?.completed?.[id]
  );

  const missingRequiredSteps = stepOrder
    .filter((id) => stepRegistry[id].required && !state?.completed?.[id])
    .map((id) => stepRegistry[id].label);

  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const handleLaunch = async () => {
    if (!allRequiredDone) {
      setToast({
        open: true,
        message: `Complete required steps: ${missingRequiredSteps.join(", ")}`,
      });
      return;
    }
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
      {missingRequiredSteps.length > 0 ? (
        <Tooltip
          text={`Complete required steps: ${missingRequiredSteps.join(", ")}`}
        >
          <span onClick={handleLaunch}>
            <Button disabled={!allRequiredDone}>Launch Shop</Button>
          </span>
        </Tooltip>
      ) : (
        <span onClick={handleLaunch}>
          <Button>Launch Shop</Button>
        </span>
      )}
      <Toast
        open={toast.open}
        onClose={() => setToast({ open: false, message: "" })}
        message={toast.message}
      />
    </div>
  );
}

