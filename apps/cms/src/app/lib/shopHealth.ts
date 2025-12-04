// apps/cms/src/app/lib/shopHealth.ts

import type {
  ConfiguratorProgress,
  ConfiguratorStepId,
  StepStatus,
} from "@acme/types";

export type ShopHealthStatus = "healthy" | "degraded" | "broken";

export interface ShopHealthSummary {
  status: ShopHealthStatus;
  issues: Array<{
    stepId: ConfiguratorStepId;
    reason: string;
  }>;
  environments?: Array<{ env: string; status?: string }>;
}

const REQUIRED_STEPS: ConfiguratorStepId[] = [
  "shop-basics",
  "theme",
  "payments",
  "shipping-tax",
  "checkout",
  "products-inventory",
  "navigation-home",
];

const OPTIONAL_STEPS: ConfiguratorStepId[] = [
  "domains",
  "reverse-logistics",
  "advanced-seo",
  "reach-social",
];

function isIncomplete(status: StepStatus | undefined): boolean {
  return status !== "complete" && status !== undefined;
}

export function deriveShopHealth(
  progress?: ConfiguratorProgress | null,
): ShopHealthSummary {
  if (!progress || !progress.steps) {
    return { status: "degraded", issues: [] };
  }

  const { steps, errors } = progress;
  const issues: ShopHealthSummary["issues"] = [];
  let hasRequiredError = false;
  let hasRequiredIncomplete = false;
  let hasOptionalIssue = false;

  const trackStep = (stepId: ConfiguratorStepId, required: boolean) => {
    const status: StepStatus | undefined = steps[stepId];
    const reason = errors?.[stepId];

    if (status === "error" || typeof reason === "string") {
      if (required) {
        hasRequiredError = true;
      } else {
        hasOptionalIssue = true;
      }
      if (typeof reason === "string") {
        issues.push({ stepId, reason });
      }
      return;
    }

    if (required && isIncomplete(status)) {
      hasRequiredIncomplete = true;
    }
    if (!required && isIncomplete(status)) {
      hasOptionalIssue = true;
    }
  };

  for (const id of REQUIRED_STEPS) {
    trackStep(id, true);
  }
  for (const id of OPTIONAL_STEPS) {
    trackStep(id, false);
  }

  if (hasRequiredError) {
    return { status: "broken", issues };
  }
  if (hasRequiredIncomplete || hasOptionalIssue) {
    return { status: "degraded", issues };
  }
  return { status: "healthy", issues };
}
