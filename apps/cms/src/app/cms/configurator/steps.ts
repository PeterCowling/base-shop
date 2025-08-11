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
  deps: string[];
}

export const steps: ConfiguratorStep[] = [
  { id: "shop-details", label: "Shop Details", component: StepShopDetails, required: true, deps: [] },
  { id: "theme", label: "Theme", component: StepTheme, required: true, deps: ["shop-details"] },
  { id: "tokens", label: "Tokens", component: StepTokens, required: true, deps: ["theme"] },
  { id: "options", label: "Options", component: StepOptions, required: true, deps: ["tokens"] },
  { id: "navigation", label: "Navigation", component: StepNavigation, required: true, deps: ["options"] },
  { id: "layout", label: "Layout", component: StepLayout, required: true, deps: ["navigation"] },
  { id: "home-page", label: "Home Page", component: StepHomePage, required: true, deps: ["layout"] },
  { id: "checkout-page", label: "Checkout Page", component: StepCheckoutPage, required: true, deps: ["home-page"] },
  { id: "shop-page", label: "Shop Page", component: StepShopPage, required: true, deps: ["checkout-page"] },
  { id: "product-page", label: "Product Page", component: StepProductPage, required: true, deps: ["shop-page"] },
  { id: "additional-pages", label: "Additional Pages", component: StepAdditionalPages, required: true, deps: ["product-page"] },
  { id: "env-vars", label: "Environment Variables", component: StepEnvVars, required: true, deps: ["additional-pages"] },
  { id: "summary", label: "Summary", component: StepSummary, required: true, deps: ["env-vars"] },
  { id: "import-data", label: "Import Data", component: StepImportData, required: false, deps: ["summary"] },
  { id: "seed-data", label: "Seed Data", component: StepSeedData, required: false, deps: ["import-data"] },
  { id: "hosting", label: "Hosting", component: StepHosting, required: false, deps: ["seed-data"] },
];

export default steps;
