// apps/cms/src/app/cms/configurator/hooks/useLaunchShop.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { getCsrfToken } from "@acme/shared-utils";
import { getRequiredSteps } from "../steps";
import type { ConfiguratorState } from "../../wizard/schema";
import type { ConfiguratorStep } from "../types";

export type LaunchStepStatus = "idle" | "pending" | "success" | "failure";

interface Options {
  onIncomplete?: (steps: ConfiguratorStep[]) => void;
}

export function useLaunchShop(
  state: ConfiguratorState,
  options: Options = {}
): {
  launchShop: () => Promise<void>;
  launchStatus: Record<string, LaunchStepStatus> | null;
  launchError: string | null;
  failedStep: string | null;
  allRequiredDone: boolean;
  tooltipText: string;
} {
  const { onIncomplete } = options;
  const [launchStatus, setLaunchStatus] = useState<
    Record<string, LaunchStepStatus> | null
  >(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<string | null>(null);

  const missingRequired = useMemo(
    () =>
      getRequiredSteps().filter((s) => state?.completed?.[s.id] !== "complete"),
    [state?.completed]
  );
  const allRequiredDone = missingRequired.length === 0;

  const tooltipText = allRequiredDone
    ? "All steps complete"
    : `Complete required steps: ${missingRequired
        .map((s) => s.label)
        .join(", ")}`;

  const launchShop = useCallback(async () => {
    if (!state?.shopId) return;
    if (!allRequiredDone) {
      onIncomplete?.(missingRequired);
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
    try {
      const res = await fetch("/api/launch-shop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken() ?? "",
        },
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
            setLaunchStatus((prev) => ({
              ...(prev || {}),
              [data.step]: data.status,
            }));
            if (data.status === "failure") {
              setLaunchError(data.error || "Launch failed");
              setFailedStep(data.step);
            }
          }
        }
      }
    } catch {
      setLaunchError("Launch failed");
    }
  }, [state, allRequiredDone, missingRequired, onIncomplete]);

  return {
    launchShop,
    launchStatus,
    launchError,
    failedStep,
    allRequiredDone,
    tooltipText,
  };
}

export default useLaunchShop;
