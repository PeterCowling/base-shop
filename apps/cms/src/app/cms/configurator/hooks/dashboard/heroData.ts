import type { ShopHealthSummary } from "../../../../lib/shopHealth";
import type { ConfiguratorStep } from "../../types";

import type {
  ConfiguratorHeroData,
  HeroResumeCta,
  QuickStat,
  StepGroupInfo,
} from "./types";

export function buildHeroData(
  groups: StepGroupInfo,
  allRequiredDone: boolean,
  onStepClick: (step: ConfiguratorStep) => void,
  shopHealth?: ShopHealthSummary | null,
): { heroData: ConfiguratorHeroData; quickStats: QuickStat[] } {
  const {
    requiredSteps,
    requiredCompleted,
    optionalSteps,
    optionalCompleted,
    skippedOptional,
    progressPercent,
    nextStep,
  } = groups;

  const heroDescription = (() => {
    const remainingRequired = requiredSteps.length - requiredCompleted;
    if (!nextStep) {
      return "Every foundational step is complete. You can launch now or explore optional enhancements.";
    }
    const suffix = remainingRequired === 1 ? "" : "s";
    return `You are only ${remainingRequired} step${suffix} away from launch.`;
  })();

  const essentialProgressLabel = `${requiredCompleted}/${requiredSteps.length || 0} essential steps complete`;

  const resumeCta: HeroResumeCta = nextStep
    ? {
        href: `/cms/configurator/${nextStep.id}`,
        label: `Resume ${nextStep.label}`,
        isPrimary: true,
        onClick: () => onStepClick(nextStep),
      }
    : {
        href: "/cms/configurator",
        label: "Review configuration",
        isPrimary: false,
      };

  const coreValue = `${requiredCompleted}/${requiredSteps.length || 0}`;
  const coreCaption =
    requiredCompleted === requiredSteps.length
      ? "All essential steps complete"
      : `${requiredSteps.length - requiredCompleted} remaining before launch`;

  const optionalValue = optionalSteps.length ? `${optionalCompleted}/${optionalSteps.length}` : "0";

  let optionalCaption = "";
  if (optionalSteps.length === 0) {
    optionalCaption = "No optional steps configured";
  } else if (skippedOptional > 0) {
    optionalCaption = `${optionalCompleted} done • ${skippedOptional} skipped`;
  } else {
    optionalCaption = `${optionalCompleted} completed so far`;
  }

  const healthLabel = "Shop health";
  let healthValue = "Unknown";
  let healthCaption = "Run configuration checks to see status.";

  if (shopHealth) {
    if (shopHealth.status === "healthy") {
      healthValue = "Healthy";
      healthCaption = "All critical checks are passing.";
    } else if (shopHealth.status === "degraded") {
      healthValue = "Needs attention";
      healthCaption = "Some configuration checks need review.";
    } else if (shopHealth.status === "broken") {
      healthValue = "Blocked";
      healthCaption = "Critical checks are failing; fix before launch.";
    }
  }

  const quickStats: QuickStat[] = [
    { label: "Core milestones", value: coreValue, caption: coreCaption },
    { label: "Optional upgrades", value: optionalValue, caption: optionalCaption },
    {
      label: healthLabel,
      value: healthValue,
      caption: healthCaption,
    },
  ];

  const heroData: ConfiguratorHeroData = {
    description: heroDescription,
    progressPercent,
    essentialProgressLabel,
    resumeCta,
    quickStats,
  };

  return { heroData, quickStats };
}
