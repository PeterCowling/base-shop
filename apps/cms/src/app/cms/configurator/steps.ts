import StepShopDetails from "../wizard/steps/StepShopDetails";
import StepTheme from "../wizard/steps/StepTheme";
import StepTokens from "../wizard/steps/StepTokens";
import StepOptions from "../wizard/steps/StepOptions";
import StepNavigation from "../wizard/steps/StepNavigation";
import StepLayout from "../wizard/steps/StepLayout";
import StepHomePage from "../wizard/steps/StepHomePage";
import StepCheckoutPage from "../wizard/steps/StepCheckoutPage";
import StepShopPage from "../wizard/steps/StepShopPage";
import StepProductPage from "../wizard/steps/StepProductPage";
import StepAdditionalPages from "../wizard/steps/StepAdditionalPages";
import StepEnvVars from "../wizard/steps/StepEnvVars";
import StepSummary from "../wizard/steps/StepSummary";
import StepImportData from "../wizard/steps/StepImportData";
import StepSeedData from "../wizard/steps/StepSeedData";
import StepHosting from "../wizard/steps/StepHosting";

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
