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
  prerequisites?: string[];
}

export type StepStatus = "pending" | "done";

export const steps: Record<string, ConfiguratorStep> = {
  "shop-details": {
    id: "shop-details",
    label: "Shop Details",
    component: StepShopDetails,
    required: true,
  },
  theme: {
    id: "theme",
    label: "Theme",
    component: StepTheme,
    required: true,
    prerequisites: ["shop-details"],
  },
  tokens: {
    id: "tokens",
    label: "Tokens",
    component: StepTokens,
    required: true,
    prerequisites: ["theme"],
  },
  options: {
    id: "options",
    label: "Options",
    component: StepOptions,
    required: true,
    prerequisites: ["tokens"],
  },
  navigation: {
    id: "navigation",
    label: "Navigation",
    component: StepNavigation,
    required: true,
    prerequisites: ["options"],
  },
  layout: {
    id: "layout",
    label: "Layout",
    component: StepLayout,
    required: true,
    prerequisites: ["navigation"],
  },
  "home-page": {
    id: "home-page",
    label: "Home Page",
    component: StepHomePage,
    required: true,
    prerequisites: ["layout"],
  },
  "checkout-page": {
    id: "checkout-page",
    label: "Checkout Page",
    component: StepCheckoutPage,
    required: true,
    prerequisites: ["home-page"],
  },
  "shop-page": {
    id: "shop-page",
    label: "Shop Page",
    component: StepShopPage,
    required: true,
    prerequisites: ["checkout-page"],
  },
  "product-page": {
    id: "product-page",
    label: "Product Page",
    component: StepProductPage,
    required: true,
    prerequisites: ["shop-page"],
  },
  "additional-pages": {
    id: "additional-pages",
    label: "Additional Pages",
    component: StepAdditionalPages,
    required: true,
    prerequisites: ["product-page"],
  },
  "env-vars": {
    id: "env-vars",
    label: "Environment Variables",
    component: StepEnvVars,
    required: true,
    prerequisites: ["additional-pages"],
  },
  summary: {
    id: "summary",
    label: "Summary",
    component: StepSummary,
    required: true,
    prerequisites: ["env-vars"],
  },
  "import-data": {
    id: "import-data",
    label: "Import Data",
    component: StepImportData,
    required: false,
    prerequisites: ["summary"],
  },
  "seed-data": {
    id: "seed-data",
    label: "Seed Data",
    component: StepSeedData,
    required: false,
    prerequisites: ["import-data"],
  },
  hosting: {
    id: "hosting",
    label: "Hosting",
    component: StepHosting,
    required: false,
    prerequisites: ["seed-data"],
  },
};

export const stepOrder = [
  "shop-details",
  "theme",
  "tokens",
  "options",
  "navigation",
  "layout",
  "home-page",
  "checkout-page",
  "shop-page",
  "product-page",
  "additional-pages",
  "env-vars",
  "summary",
  "import-data",
  "seed-data",
  "hosting",
];

export const initialStepStatus: Record<string, StepStatus> = Object.fromEntries(
  stepOrder.map((id) => [id, "pending"])
);

