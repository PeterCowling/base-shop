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
  /** IDs of steps that must be completed before this step */
  prerequisites?: string[];
  order?: number;
}

const stepList: ConfiguratorStep[] = [
  { id: "shop-details", label: "Shop Details", component: StepShopDetails, order: 1 },
  { id: "theme", label: "Theme", component: StepTheme, prerequisites: ["shop-details"], order: 2 },
  { id: "tokens", label: "Tokens", component: StepTokens, prerequisites: ["theme"], order: 3 },
  { id: "options", label: "Options", component: StepOptions, prerequisites: ["tokens"], order: 4 },
  {
    id: "navigation",
    label: "Navigation",
    component: StepNavigation,
    prerequisites: ["options"],
    order: 5,
  },
  {
    id: "layout",
    label: "Layout",
    component: StepLayout,
    prerequisites: ["navigation"],
    order: 6,
  },
  {
    id: "home-page",
    label: "Home Page",
    component: StepHomePage,
    prerequisites: ["layout"],
    order: 7,
  },
  {
    id: "checkout-page",
    label: "Checkout Page",
    component: StepCheckoutPage,
    prerequisites: ["layout"],
    order: 8,
  },
  {
    id: "shop-page",
    label: "Shop Page",
    component: StepShopPage,
    prerequisites: ["layout"],
    order: 9,
  },
  {
    id: "product-page",
    label: "Product Page",
    component: StepProductPage,
    prerequisites: ["layout"],
    order: 10,
  },
  {
    id: "additional-pages",
    label: "Additional Pages",
    component: StepAdditionalPages,
    prerequisites: ["layout"],
    order: 11,
  },
  {
    id: "env-vars",
    label: "Environment Variables",
    component: StepEnvVars,
    prerequisites: ["additional-pages"],
    order: 12,
  },
  {
    id: "summary",
    label: "Summary",
    component: StepSummary,
    prerequisites: ["env-vars"],
    order: 13,
  },
  {
    id: "import-data",
    label: "Import Data",
    component: StepImportData,
    optional: true,
    prerequisites: ["summary"],
    order: 14,
  },
  {
    id: "seed-data",
    label: "Seed Data",
    component: StepSeedData,
    optional: true,
    prerequisites: ["summary"],
    order: 15,
  },
  {
    id: "hosting",
    label: "Hosting",
    component: StepHosting,
    optional: true,
    prerequisites: ["summary"],
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
