"use client";

import StepShopDetails from "./steps/StepShopDetails";
import StepTheme from "./steps/StepTheme";
import StepTokens from "./steps/StepTokens";
import StepOptions from "./steps/StepOptions";
import StepNavigation from "./steps/StepNavigation";
import StepLayout from "./steps/StepLayout";
import StepHomePage from "./steps/StepHomePage";
import StepCheckoutPage from "./steps/StepCheckoutPage";
import StepShopPage from "./steps/StepShopPage";
import StepProductPage from "./steps/StepProductPage";
import StepAdditionalPages from "./steps/StepAdditionalPages";
import StepEnvVars from "./steps/StepEnvVars";
import StepSummary from "./steps/StepSummary";
import StepImportData from "./steps/StepImportData";
import StepSeedData from "./steps/StepSeedData";
import StepHosting from "./steps/StepHosting";
import { Button } from "@/components/atoms/shadcn";
import { useConfigurator } from "./ConfiguratorContext";
import { useRouter } from "next/navigation";
import React from "react";

export interface ConfiguratorStep {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  optional?: boolean;
  /** IDs of steps that are recommended to complete before this step */
  recommended?: string[];
}

const stepList: ConfiguratorStep[] = [
  { id: "shop-details", label: "Shop Details", component: StepShopDetails },
  { id: "theme", label: "Theme", component: StepTheme },
  { id: "tokens", label: "Tokens", component: StepTokens },
  { id: "options", label: "Options", component: StepOptions },
  { id: "navigation", label: "Navigation", component: StepNavigation },
  {
    id: "layout",
    label: "Layout",
    component: StepLayout,
    recommended: ["navigation"],
  },
  {
    id: "home-page",
    label: "Home Page",
    component: StepHomePage,
    recommended: ["layout"],
  },
  {
    id: "checkout-page",
    label: "Checkout Page",
    component: StepCheckoutPage,
    recommended: ["layout"],
  },
  {
    id: "shop-page",
    label: "Shop Page",
    component: StepShopPage,
    recommended: ["layout"],
  },
  {
    id: "product-page",
    label: "Product Page",
    component: StepProductPage,
    recommended: ["shop-page"],
  },
  {
    id: "additional-pages",
    label: "Additional Pages",
    component: StepAdditionalPages,
    recommended: ["layout"],
  },
  { id: "env-vars", label: "Environment Variables", component: StepEnvVars },
  { id: "summary", label: "Summary", component: StepSummary },
  {
    id: "import-data",
    label: "Import Data",
    component: StepImportData,
    optional: true,
  },
  {
    id: "seed-data",
    label: "Seed Data",
    component: StepSeedData,
    optional: true,
  },
  {
    id: "hosting",
    label: "Hosting",
    component: StepHosting,
    optional: true,
  },
];

/** Ordered list of configurator steps including their index. */
export const orderedSteps: Array<ConfiguratorStep & { index: number }> =
  stepList.map((s, i) => ({ ...s, index: i }));

export const getSteps = (): ConfiguratorStep[] => [...stepList];

export const getRequiredSteps = (): ConfiguratorStep[] =>
  getSteps().filter((s) => !s.optional);

/** Map of step ID to step config including index. */
export const steps: Record<string, ConfiguratorStep & { index: number }> =
  Object.fromEntries(orderedSteps.map((s) => [s.id, s]));

interface ProgressProps {
  currentStepId: string;
}

/** Progress indicator showing completion state for each step. */
export function StepProgress({ currentStepId }: ProgressProps): React.JSX.Element {
  const { state } = useConfigurator();
  return (
    <ol className="mb-4 flex flex-wrap gap-2">
      {orderedSteps.map((s) => {
        const completed = state.completed[s.id] === "complete";
        const isCurrent = s.id === currentStepId;
        return (
          <li key={s.id} className="flex items-center">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                completed ? "bg-green-500 text-white" : "bg-gray-200 text-gray-800"
              } ${isCurrent ? "ring-2 ring-primary" : ""}`}
            >
              {s.index + 1}
            </span>
            <span className={`ml-1 text-sm ${isCurrent ? "font-medium" : ""}`}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

interface ControlsProps {
  prev?: string;
  next?: string;
  onNext?: () => Promise<void> | void;
  nextDisabled?: boolean;
}

/** Renders "Back" and "Next" buttons for navigating between steps. */
export function StepControls({
  prev,
  next,
  onNext,
  nextDisabled,
}: ControlsProps): React.JSX.Element {
  const router = useRouter();
  return (
    <div className="mt-4 flex justify-between">
      {prev ? (
        <Button variant="outline" onClick={() => router.push(`/cms/configurator/${prev}`)}>
          Back
        </Button>
      ) : (
        <span />
      )}
      <Button
        onClick={async () => {
          await onNext?.();
          router.push(next ? `/cms/configurator/${next}` : "/cms/configurator");
        }}
        disabled={nextDisabled}
      >
        {next ? "Next" : "Finish"}
      </Button>
    </div>
  );
}

