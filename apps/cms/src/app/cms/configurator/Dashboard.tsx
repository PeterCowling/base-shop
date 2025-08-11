"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/atoms/shadcn";
import { Toast, Tooltip } from "@/components/atoms";
import stepRegistry from "./steps";
import type { WizardState } from "../wizard/schema";

interface StepConfig {
  id: string;
  title: string;
  href: string;
  required?: boolean;
  completed: boolean;
}

export default function ConfiguratorDashboard() {
  const [state, setState] = useState<WizardState | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  useEffect(() => {
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setState(json))
      .catch(() => setState(null));
  }, []);

  const steps: StepConfig[] = [
    {
      id: "shop-details",
      title: "Shop Details",
      href: "/cms/wizard",
      required: true,
      completed: Boolean(state?.completed?.["shop-details"]),
    },
    {
      id: "theme",
      title: "Theme",
      href: "/cms/wizard",
      required: true,
      completed: Boolean(state?.completed?.theme),
    },
    {
      id: "import-data",
      title: "Products",
      href: "/cms/wizard",
      required: false,
      completed: Boolean(state?.completed?.["import-data"]),
    },
  ];

  const completedRecord = state?.completed ?? {};
  const missingRequired = stepRegistry.filter(
    (s) => s.required && !completedRecord[s.id]
  );
  const allRequiredDone = missingRequired.length === 0;

  const missingLabels = missingRequired.map((s) => s.label).join(", ");

  const handleLaunch = () => {
    if (!allRequiredDone) {
      setToast({
        open: true,
        message: `Complete required steps: ${missingLabels}`,
      });
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
      <Tooltip
        text={!allRequiredDone ? `Complete: ${missingLabels}` : ""}
      >
        <span onClick={handleLaunch}>
          <Button
            disabled={!allRequiredDone}
            className={!allRequiredDone ? "pointer-events-none" : undefined}
          >
            Launch Shop
          </Button>
        </span>
      </Tooltip>
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </div>
  );
}

