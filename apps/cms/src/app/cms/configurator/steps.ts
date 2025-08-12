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
  /** IDs of steps that must be completed before this step */
  prerequisites?: string[];
  order?: number;
}

const stepList: ConfiguratorStep[] = [
  { id: "shop-details", label: "Shop Details", component: StepShopDetails, order: 1 },
  { id: "theme", label: "Theme", component: StepTheme, order: 2 },
  { id: "tokens", label: "Tokens", component: StepTokens, order: 3 },
  { id: "options", label: "Options", component: StepOptions, order: 4 },
  { id: "navigation", label: "Navigation", component: StepNavigation, order: 5 },
  {
    id: "layout",
    label: "Layout",
    component: StepLayout,
    order: 6,
    prerequisites: ["navigation"],
  },
  {
    id: "home-page",
    label: "Home Page",
    component: StepHomePage,
    order: 7,
    prerequisites: ["layout"],
  },
  {
    id: "checkout-page",
    label: "Checkout Page",
    component: StepCheckoutPage,
    order: 8,
    prerequisites: ["layout"],
  },
  {
    id: "shop-page",
    label: "Shop Page",
    component: StepShopPage,
    order: 9,
    prerequisites: ["layout"],
  },
  {
    id: "product-page",
    label: "Product Page",
    component: StepProductPage,
    order: 10,
    prerequisites: ["shop-page"],
  },
  {
    id: "additional-pages",
    label: "Additional Pages",
    component: StepAdditionalPages,
    order: 11,
    prerequisites: ["layout"],
  },
  { id: "env-vars", label: "Environment Variables", component: StepEnvVars, order: 12 },
  { id: "summary", label: "Summary", component: StepSummary, order: 13 },
  {
    id: "import-data",
    label: "Import Data",
    component: StepImportData,
    optional: true,
    order: 14,
  },
  {
    id: "seed-data",
    label: "Seed Data",
    component: StepSeedData,
    optional: true,
    order: 15,
  },
  {
    id: "hosting",
    label: "Hosting",
    component: StepHosting,
    optional: true,
    order: 16,
  },
];

export const getSteps = (): ConfiguratorStep[] =>
  [...stepList].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const getRequiredSteps = (): ConfiguratorStep[] =>
  getSteps().filter((s) => !s.optional);

export const steps: Record<string, ConfiguratorStep> = Object.fromEntries(
  getSteps().map((s) => [s.id, s])
);
