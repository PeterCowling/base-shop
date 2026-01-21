// apps/cms/src/app/cms/configurator/hooks/dashboard/launchChecklist.ts
//
// Shared helper to derive the builder-facing launch checklist from
// server-side ConfiguratorProgress + translations.

import {
  OPTIONAL_CONFIG_CHECK_STEPS,
  REQUIRED_CONFIG_CHECK_STEPS,
} from "@acme/platform-core/configurator";
import type { ConfiguratorProgress } from "@acme/types";

import type { LaunchChecklistItem } from "./types";

export interface BuildLaunchChecklistParams {
  progress: ConfiguratorProgress;
  translate: (key: string) => string;
}

export function buildLaunchChecklist({
  progress,
  translate,
}: BuildLaunchChecklistParams): LaunchChecklistItem[] {
  const stepsById: Partial<Record<string, string>> = progress.steps ?? {};

  const requiredItems = REQUIRED_CONFIG_CHECK_STEPS.map((stepId) => {
    const rawStatus = stepsById[stepId] ?? "pending";

    let labelKey: string;
    switch (stepId) {
      case "shop-basics":
        labelKey = "cms.configurator.launchChecklist.shopBasics";
        break;
      case "theme":
        labelKey = "cms.configurator.launchChecklist.theme";
        break;
      case "payments":
        labelKey = "cms.configurator.launchChecklist.payments";
        break;
      case "shipping-tax":
        labelKey = "cms.configurator.launchChecklist.shippingTax";
        break;
      case "checkout":
        labelKey = "cms.configurator.launchChecklist.checkout";
        break;
      case "products-inventory":
        labelKey = "cms.configurator.launchChecklist.productsInventory";
        break;
      case "legal":
        labelKey = "cms.configurator.launchChecklist.legal";
        break;
      case "navigation-home":
        labelKey = "cms.configurator.launchChecklist.navigationHome";
        break;
      default:
        labelKey = stepId;
        break;
    }

    const label = translate(labelKey);

    const status: LaunchChecklistItem["status"] =
      rawStatus === "complete"
        ? "complete"
        : rawStatus === "error"
          ? "error"
          : "pending";

    const statusLabelKey =
      status === "complete"
        ? "cms.configurator.launchChecklist.status.complete"
        : status === "error"
          ? "cms.configurator.launchChecklist.status.error"
          : "cms.configurator.launchChecklist.status.pending";

    const statusLabel = translate(statusLabelKey);
    const sharedFixLabel = translate("cms.configurator.launchChecklist.fix");

    let targetHref = "/cms/configurator";
    let exitReason: LaunchChecklistItem["exitReason"];

    switch (stepId) {
      case "shop-basics":
        targetHref = "/cms/configurator/shop-basics";
        break;
      case "theme":
        targetHref = "/cms/configurator/theme";
        break;
      case "payments":
        targetHref = "/cms/configurator/payments";
        break;
      case "shipping-tax":
        targetHref = "/cms/configurator/shipping-tax";
        break;
      case "checkout":
        targetHref = progress.shopId
          ? `/cms/shop/${progress.shopId}/pages/checkout/builder`
          : "/cms/configurator/checkout";
        exitReason = "pages";
        break;
      case "products-inventory":
        targetHref = progress.shopId
          ? `/cms/shop/${progress.shopId}/products/first`
          : "/cms/products";
        exitReason = "products";
        break;
      case "legal":
        targetHref = "/cms/configurator/navigation-home";
        exitReason = "pages";
        break;
      case "navigation-home":
        targetHref = "/cms/configurator/navigation-home";
        break;
      default:
        break;
    }

    return {
      id: stepId,
      label,
      status,
      statusLabel,
      targetHref,
      fixLabel: status === "complete" ? undefined : sharedFixLabel,
      exitReason,
    };
  });

  const optionalPowerUps = OPTIONAL_CONFIG_CHECK_STEPS.filter(
    (id) => id === "reach-social",
  ).map((stepId) => {
    const rawStatus = stepsById[stepId] ?? "pending";
    const status: LaunchChecklistItem["status"] =
      rawStatus === "complete"
        ? "complete"
        : rawStatus === "error"
          ? "error"
          : "pending";

    const statusLabelKey =
      status === "complete"
        ? "cms.configurator.launchChecklist.status.complete"
        : status === "error"
          ? "cms.configurator.launchChecklist.status.error"
          : "cms.configurator.launchChecklist.status.pending";

    const labelKey = "cms.configurator.launchChecklist.reachSocial";
    const translatedLabel = translate(labelKey);
    const label =
      translatedLabel === labelKey
        ? "Power-up: Reach"
        : translatedLabel;

    return {
      id: stepId,
      label,
      status,
      statusLabel: translate(statusLabelKey),
      targetHref: "/cms/configurator/navigation-home",
      fixLabel:
        status === "complete"
          ? undefined
          : translate("cms.configurator.launchChecklist.fix"),
      exitReason: "pages" as const,
    };
  });

  return [...requiredItems, ...optionalPowerUps];
}

export function isLaunchReady(progress: ConfiguratorProgress): boolean {
  const stepsById: Partial<Record<string, string>> = progress.steps ?? {};
  return REQUIRED_CONFIG_CHECK_STEPS.every(
    (stepId) => stepsById[stepId] === "complete",
  );
}

export function calculateProgressFromServer(
  progress: ConfiguratorProgress,
): {
  completedRequired: number;
  totalRequired: number;
  completedOptional: number;
  totalOptional: number;
} {
  const stepsById: Partial<Record<string, string>> = progress.steps ?? {};

  const completedRequired = REQUIRED_CONFIG_CHECK_STEPS.filter(
    (id) => stepsById[id] === "complete",
  ).length;
  const completedOptional = OPTIONAL_CONFIG_CHECK_STEPS.filter(
    (id) => stepsById[id] === "complete",
  ).length;

  return {
    completedRequired,
    totalRequired: REQUIRED_CONFIG_CHECK_STEPS.length,
    completedOptional,
    totalOptional: OPTIONAL_CONFIG_CHECK_STEPS.length,
  };
}
