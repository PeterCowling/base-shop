// apps/cms/src/app/cms/configurator/hooks/dashboard/timeToLaunch.ts
import type { ConfiguratorStep } from "../../types";
import type { StepStatus } from "../../../wizard/schema";
import type { TimeToLaunchData } from "./types";

// Approximate minute budgets lifted from docs/cms/build-shop-guide.md
// (“Launch in under an hour” table).
const STEP_MINUTES: Record<string, number> = {
  "shop-details": 8,
  theme: 8,
  "payment-provider": 10,
  shipping: 8,
  "checkout-page": 8,
  inventory: 13,
};

const TARGET_MINUTES = 60;

export function buildTimeToLaunch(
  steps: ConfiguratorStep[],
  completed: Record<string, StepStatus | undefined> | undefined,
  startMs: number | null,
  nowMs: number,
  ready: boolean,
): TimeToLaunchData {
  const remainingMinutes = steps.reduce((minutes, step) => {
    const budget = STEP_MINUTES[step.id];
    if (!budget) return minutes;
    const status = completed?.[step.id];
    if (status === "complete" || status === "skipped") return minutes;
    return minutes + budget;
  }, 0);

  const targetMs = TARGET_MINUTES * 60_000;
  const elapsedMs = startMs ? Math.max(0, nowMs - startMs) : 0;
  const remainingMs = remainingMinutes * 60_000;
  const countdownMs = startMs ? Math.max(0, targetMs - elapsedMs) : targetMs;
  const etaMs = startMs ? nowMs + remainingMs : null;
  const progressPercent = startMs
    ? Math.min(100, Math.round((elapsedMs / targetMs) * 100))
    : 0;
  const onTrack = startMs ? remainingMs <= countdownMs : true;

  return {
    startMs,
    elapsedMs,
    remainingMs,
    countdownMs,
    targetMs,
    etaMs,
    progressPercent,
    onTrack,
    ready,
  };
}
