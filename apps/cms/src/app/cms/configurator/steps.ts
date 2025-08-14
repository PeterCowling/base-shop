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
import type { StepStatus } from "../wizard/schema";
import { cn } from "@ui/utils/style";

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
      {list.map((s, idx) => (
        <li key={s.id} className="flex flex-1 items-center gap-2">
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
          <span className={cn(idx === currentIdx && "font-medium")}>{
            s.label
          }</span>
          {idx < list.length - 1 && (
            <span className="border-muted ml-2 flex-1 border-t" />
          )}
        </li>
      ))}
    </ol>
  );
}

