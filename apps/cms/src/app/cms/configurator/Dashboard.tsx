"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/atoms/shadcn";
import type { WizardState } from "../wizard/schema";
import { createShop } from "../wizard/services/createShop";
import { initShop } from "../wizard/services/initShop";
import { deployShop } from "../wizard/services/deployShop";
import { steps as stepConfig, stepOrder } from "./steps";

export default function ConfiguratorDashboard() {
  const [state, setState] = useState<WizardState | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        setState(json?.state ?? json);
        setCompleted(json?.completed ?? {});
      })
      .catch(() => {
        setState(null);
        setCompleted({});
      });
  }, []);

  const allRequiredDone = stepOrder.every(
    (id) => !stepConfig[id].required || completed[id]
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
          {stepOrder.map((id) => {
            const step = stepConfig[id];
            return (
              <li key={id} className="flex items-center gap-2">
                {completed[id] ? (
                  <CheckCircledIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <CircleIcon className="h-4 w-4 text-gray-400" />
                )}
                <Link href={`/cms/configurator/${id}`} className="underline">
                  {step.label}
                </Link>
              </li>
            );
          })}
        </ul>
      <Button disabled={!allRequiredDone} onClick={launchShop}>
        Launch Shop
      </Button>
    </div>
  );
}

