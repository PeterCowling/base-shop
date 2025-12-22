// apps/cms/src/app/cms/configurator/hooks/useLaunchShop.ts
"use client";

// Docs: docs/cms/build-shop-guide.md
// Docs: docs/cms/configurator-contract.md

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCsrfToken } from "@acme/shared-utils";
import { getRequiredSteps } from "../steps";
import { useTranslations } from "@acme/i18n";
import type { ConfiguratorState } from "../../wizard/schema";
import type { ConfiguratorStep } from "../types";
import type { Environment } from "@acme/types";

export type LaunchStepStatus = "idle" | "pending" | "success" | "failure";

interface Options {
  onIncomplete?: (steps: ConfiguratorStep[]) => void;
  env?: Environment;
}

type LaunchShopErrorPayload = {
  error?: string;
  missingSteps?: string[];
};

export function useLaunchShop(
  state: ConfiguratorState,
  options: Options = {},
): {
  launchShop: () => Promise<void>;
  launchStatus: Record<string, LaunchStepStatus> | null;
  launchError: string | null;
  failedStep: string | null;
  allRequiredDone: boolean;
  tooltipText: string;
  missingSteps: ConfiguratorStep[] | null;
  clearMissingSteps: () => void;
} {
  const t = useTranslations();
  const { onIncomplete, env = "stage" } = options;
  const [launchStatus, setLaunchStatus] = useState<
    Record<string, LaunchStepStatus> | null
  >(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<string | null>(null);
  const [missingSteps, setMissingSteps] = useState<ConfiguratorStep[] | null>(null);

  const requiredSteps = useMemo(
    () =>
      getRequiredSteps(t as unknown as (key: string, vars?: Record<string, unknown>) => string),
    [t],
  );

  const missingRequired = useMemo(
    () => requiredSteps.filter((s) => state?.completed?.[s.id] !== "complete"),
    [requiredSteps, state?.completed],
  );
  const allRequiredDone = missingRequired.length === 0;

  const tooltipText = allRequiredDone
    ? (t("cms.configurator.launch.tooltip.allComplete") as string)
    : (t("cms.configurator.launch.tooltip.completeRequired", {
        list: missingRequired.map((s) => s.label).join(", "),
      }) as string);

  useEffect(() => {
    if (missingSteps && missingSteps.length > 0 && allRequiredDone) {
      setMissingSteps(null);
    }
  }, [allRequiredDone, missingSteps]);

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
        body: JSON.stringify({ shopId: state.shopId, state, seed, env }),
      });
      if (!res.ok) {
        let payload: LaunchShopErrorPayload | null = null;
        try {
          payload = (await res.json()) as LaunchShopErrorPayload;
        } catch {
          /* ignore parse errors */
        }
        if (payload?.missingSteps) {
          const mapped = requiredSteps.filter((s) =>
            payload?.missingSteps?.includes(s.id),
          );
          if (mapped.length > 0) {
            setMissingSteps(mapped);
            onIncomplete?.(mapped);
          }
        }
        setLaunchError(
          payload?.error ?? (t("cms.configurator.launch.failed") as string),
        );
        setLaunchStatus(null);
        return;
      }
      setMissingSteps(null);
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
  }, [state, allRequiredDone, missingRequired, onIncomplete, t, env, requiredSteps]);

  return {
    launchShop,
    launchStatus,
    launchError,
    failedStep,
    allRequiredDone,
    tooltipText,
    missingSteps,
    clearMissingSteps: () => setMissingSteps(null),
  };
}

export default useLaunchShop;
