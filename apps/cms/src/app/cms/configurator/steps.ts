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
