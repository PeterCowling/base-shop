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
  { id: "theme", label: "Theme", component: StepTheme, order: 2 },
  { id: "tokens", label: "Tokens", component: StepTokens, order: 3 },
  { id: "options", label: "Options", component: StepOptions, order: 4 },
  { id: "navigation", label: "Navigation", component: StepNavigation, order: 5 },
  { id: "layout", label: "Layout", component: StepLayout, order: 6 },
  { id: "home-page", label: "Home Page", component: StepHomePage, order: 7 },
  { id: "checkout-page", label: "Checkout Page", component: StepCheckoutPage, order: 8 },
  { id: "shop-page", label: "Shop Page", component: StepShopPage, order: 9 },
  { id: "product-page", label: "Product Page", component: StepProductPage, order: 10 },
  { id: "additional-pages", label: "Additional Pages", component: StepAdditionalPages, order: 11 },
  { id: "env-vars", label: "Environment Variables", component: StepEnvVars, order: 12 },
  { id: "summary", label: "Summary", component: StepSummary, order: 13 },
  { id: "import-data", label: "Import Data", component: StepImportData, optional: true, order: 14 },
  { id: "seed-data", label: "Seed Data", component: StepSeedData, optional: true, order: 15 },
  { id: "hosting", label: "Hosting", component: StepHosting, optional: true, order: 16 },
];

export const getSteps = (): ConfiguratorStep[] =>
  [...stepList].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const getRequiredSteps = (): ConfiguratorStep[] =>
  getSteps().filter((s) => !s.optional);

export const steps: Record<string, ConfiguratorStep> = Object.fromEntries(
  getSteps().map((s) => [s.id, s])
);
