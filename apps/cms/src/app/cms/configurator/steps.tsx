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
import { CheckIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import type { StepStatus } from "../wizard/schema";
import { cn } from "@ui/utils/style";
import { Tooltip } from "@/components/atoms";
import type { ConfiguratorStep } from "./types";
import type { ConfiguratorStepProps } from "@/types/configurator";

const stepList: ConfiguratorStep[] = [
  { id: "shop-details", label: "Shop Details", component: StepShopDetails },
  { id: "theme", label: "Theme", component: StepTheme },
  { id: "tokens", label: "Tokens", component: StepTokens },
  { id: "options", label: "Options", component: StepOptions },
  {
    id: "navigation",
    label: "Navigation",
    component: StepNavigation as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "layout",
    label: "Layout",
    component: StepLayout as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["navigation"],
  },
  {
    id: "home-page",
    label: "Home Page",
    component: StepHomePage as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["layout"],
  },
  {
    id: "checkout-page",
    label: "Checkout Page",
    component: StepCheckoutPage as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["layout"],
  },
  {
    id: "shop-page",
    label: "Shop Page",
    component: StepShopPage as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["layout"],
  },
  {
    id: "product-page",
    label: "Product Page",
    component: StepProductPage as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["shop-page"],
  },
  {
    id: "additional-pages",
    label: "Additional Pages",
    component: StepAdditionalPages as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["layout"],
  },
  {
    id: "env-vars",
    label: "Environment Variables",
    component: StepEnvVars as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "summary",
    label: "Summary",
    component: StepSummary as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "import-data",
    label: "Import Data",
    component: StepImportData as unknown as React.ComponentType<ConfiguratorStepProps>,
    optional: true,
  },
  {
    id: "seed-data",
    label: "Seed Data",
    component: StepSeedData as unknown as React.ComponentType<ConfiguratorStepProps>,
    optional: true,
  },
  {
    id: "hosting",
    label: "Hosting",
    component: StepHosting as unknown as React.ComponentType<ConfiguratorStepProps>,
    optional: true,
  },
];

export const getSteps = (): ConfiguratorStep[] => [...stepList];

export const getRequiredSteps = (): ConfiguratorStep[] =>
  getSteps().filter((s) => !s.optional);

export const steps: Record<string, ConfiguratorStep> = Object.fromEntries(
  getSteps().map((s) => [s.id, s])
);

/** Mapping of step id to its index in the overall flow */
export const stepIndex: Record<string, number> = Object.fromEntries(
  stepList.map((s, i) => [s.id, i])
);

interface ProgressProps {
  currentStepId: string;
  completed: Record<string, StepStatus | undefined>;
}

/** Horizontal progress indicator for the configurator wizard. */
export function ConfiguratorProgress({
  currentStepId,
  completed,
}: ProgressProps) {
  const list = getSteps();
  const currentIdx = stepIndex[currentStepId] ?? 0;
  return (
    <ol className="flex items-center gap-4 text-sm">
      {list.map((s, idx) => {
        const status = completed[s.id] ?? "pending";
        const statusText =
          status === "complete"
            ? "Done"
            : status === "skipped"
              ? "Skipped"
              : "Pending";
        const isDisabled = idx > currentIdx;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <Tooltip text={statusText}>
              <Link
                href={`/cms/configurator/${s.id}`}
                aria-disabled={isDisabled}
                tabIndex={isDisabled ? -1 : undefined}
                className={cn(
                  "flex items-center gap-2",
                  isDisabled
                    ? "pointer-events-none cursor-default"
                    : "hover:underline"
                )}
              >
                <span
                  className={cn(
                    "grid size-6 place-content-center rounded-full border",
                    completed[s.id] === "complete" &&
                      "bg-primary border-primary text-primary-fg",
                    idx === currentIdx && "border-primary",
                    idx > currentIdx && "text-muted-foreground border-muted"
                  )}
                >
                  {completed[s.id] === "complete" ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span
                  className={cn(
                    idx === currentIdx && "font-medium",
                    isDisabled && "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </Link>
            </Tooltip>
            {idx < list.length - 1 && (
              <span className="border-muted ml-2 flex-1 border-t" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

