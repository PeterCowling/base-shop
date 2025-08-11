"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/atoms/shadcn";
import steps from "./steps";

export default function ConfiguratorDashboard() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setCompleted(json?.completed ?? {}))
      .catch(() => setCompleted({}));
  }, []);

  const allRequiredDone = steps.every(
    (s) => !s.required || completed[s.id]
  );

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Configuration Steps</h2>
      <ul className="mb-6 space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2">
            {completed[step.id] ? (
              <CheckCircledIcon className="h-4 w-4 text-green-600" />
            ) : (
              <CircleIcon className="h-4 w-4 text-gray-400" />
            )}
            <Link href={`/cms/configurator/${step.id}`} className="underline">
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
      <Button disabled={!allRequiredDone}>Launch Shop</Button>
    </div>
  );
}

