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
  /**
   * Marks the step as optional. Required by default when undefined.
   */
  optional?: boolean;
  /**
   * Default display order. Used for navigation but does not enforce completion
   * sequence.
   */
  order?: number;
}

export type StepStatus = "pending" | "done";

const steps: Record<string, ConfiguratorStep> = {
  "shop-details": {
    id: "shop-details",
    label: "Shop Details",
    component: StepShopDetails,
    order: 1,
  },
  theme: {
    id: "theme",
    label: "Theme",
    component: StepTheme,
    order: 2,
  },
  tokens: {
    id: "tokens",
    label: "Tokens",
    component: StepTokens,
    order: 3,
  },
  options: {
    id: "options",
    label: "Options",
    component: StepOptions,
    order: 4,
  },
  navigation: {
    id: "navigation",
    label: "Navigation",
    component: StepNavigation,
    order: 5,
  },
  layout: {
    id: "layout",
    label: "Layout",
    component: StepLayout,
    order: 6,
  },
  "home-page": {
    id: "home-page",
    label: "Home Page",
    component: StepHomePage,
    order: 7,
  },
  "checkout-page": {
    id: "checkout-page",
    label: "Checkout Page",
    component: StepCheckoutPage,
    order: 8,
  },
  "shop-page": {
    id: "shop-page",
    label: "Shop Page",
    component: StepShopPage,
    order: 9,
  },
  "product-page": {
    id: "product-page",
    label: "Product Page",
    component: StepProductPage,
    order: 10,
  },
  "additional-pages": {
    id: "additional-pages",
    label: "Additional Pages",
    component: StepAdditionalPages,
    order: 11,
  },
  "env-vars": {
    id: "env-vars",
    label: "Environment Variables",
    component: StepEnvVars,
    order: 12,
  },
  summary: {
    id: "summary",
    label: "Summary",
    component: StepSummary,
    order: 13,
  },
  "import-data": {
    id: "import-data",
    label: "Import Data",
    component: StepImportData,
    optional: true,
    order: 14,
  },
  "seed-data": {
    id: "seed-data",
    label: "Seed Data",
    component: StepSeedData,
    optional: true,
    order: 15,
  },
  hosting: {
    id: "hosting",
    label: "Hosting",
    component: StepHosting,
    optional: true,
    order: 16,
  },
};

export const getSteps = (): ConfiguratorStep[] =>
  Object.values(steps).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const initialStepStatus: Record<string, StepStatus> = Object.fromEntries(
  getSteps().map(({ id }) => [id, "pending"])
);

