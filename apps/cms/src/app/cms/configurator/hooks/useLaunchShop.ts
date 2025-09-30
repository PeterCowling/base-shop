// apps/cms/src/app/cms/configurator/hooks/useLaunchShop.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { getCsrfToken } from "@acme/shared-utils";
import { getRequiredSteps } from "../steps";
import { useTranslations } from "@acme/i18n";
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
  const t = useTranslations();
  const { onIncomplete } = options;
  const [launchStatus, setLaunchStatus] = useState<
    Record<string, LaunchStepStatus> | null
  >(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<string | null>(null);

  const missingRequired = useMemo(
    () => getRequiredSteps(t as unknown as (key: string, vars?: Record<string, unknown>) => string)
      .filter((s) => state?.completed?.[s.id] !== "complete"),
    [state?.completed, t]
  );
  const allRequiredDone = missingRequired.length === 0;

  const tooltipText = allRequiredDone
    ? (t("cms.configurator.launch.tooltip.allComplete") as string)
    : (t("cms.configurator.launch.tooltip.completeRequired", {
        list: missingRequired.map((s) => s.label).join(", "),
      }) as string);

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
        setLaunchError(t("cms.configurator.launch.failed") as string);
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
              setLaunchError(data.error || (t("cms.configurator.launch.failed") as string));
              setFailedStep(data.step);
            }
          }
        }
      }
    } catch {
      setLaunchError(t("cms.configurator.launch.failed") as string);
    }
  }, [state, allRequiredDone, missingRequired, onIncomplete, t]);

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
