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
  required: boolean;
  optional?: boolean;
  order?: number;
}

export const steps: Record<string, ConfiguratorStep> = {
  "shop-details": {
    id: "shop-details",
    label: "Shop Details",
    component: StepShopDetails,
    required: true,
    order: 1,
  },
  theme: {
    id: "theme",
    label: "Theme",
    component: StepTheme,
    required: true,
    order: 2,
  },
  tokens: {
    id: "tokens",
    label: "Tokens",
    component: StepTokens,
    required: true,
    order: 3,
  },
  options: {
    id: "options",
    label: "Options",
    component: StepOptions,
    required: true,
    order: 4,
  },
  navigation: {
    id: "navigation",
    label: "Navigation",
    component: StepNavigation,
    required: true,
    order: 5,
  },
  layout: {
    id: "layout",
    label: "Layout",
    component: StepLayout,
    required: true,
    order: 6,
  },
  "home-page": {
    id: "home-page",
    label: "Home Page",
    component: StepHomePage,
    required: true,
    order: 7,
  },
  "checkout-page": {
    id: "checkout-page",
    label: "Checkout Page",
    component: StepCheckoutPage,
    required: true,
    order: 8,
  },
  "shop-page": {
    id: "shop-page",
    label: "Shop Page",
    component: StepShopPage,
    required: true,
    order: 9,
  },
  "product-page": {
    id: "product-page",
    label: "Product Page",
    component: StepProductPage,
    required: true,
    order: 10,
  },
  "additional-pages": {
    id: "additional-pages",
    label: "Additional Pages",
    component: StepAdditionalPages,
    required: true,
    order: 11,
  },
  "env-vars": {
    id: "env-vars",
    label: "Environment Variables",
    component: StepEnvVars,
    required: true,
    order: 12,
  },
  summary: {
    id: "summary",
    label: "Summary",
    component: StepSummary,
    required: true,
    order: 13,
  },
  "import-data": {
    id: "import-data",
    label: "Import Data",
    component: StepImportData,
    required: false,
    optional: true,
    order: 14,
  },
  "seed-data": {
    id: "seed-data",
    label: "Seed Data",
    component: StepSeedData,
    required: false,
    optional: true,
    order: 15,
  },
  hosting: {
    id: "hosting",
    label: "Hosting",
    component: StepHosting,
    required: false,
    optional: true,
    order: 16,
  },
};

export function getSteps(): ConfiguratorStep[] {
  return Object.values(steps).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

