import { useConfigurator } from "../ConfiguratorContext";
import type { ConfiguratorState } from "../../wizard/schema";

type Validator = (state: ConfiguratorState) => boolean;

export const validators: Record<string, Validator> = {
  "shop-type": (s) => Boolean(s.type),
  "shop-details": (s) => Boolean(s.shopId && s.storeName),
  theme: (s) => Boolean(s.theme),
  tokens: (s) => Object.keys(s.themeDefaults ?? {}).length > 0,
  // Validate analytics setup under the Payment Provider step (GA requires Measurement ID)
  "payment-provider": (s) =>
    s.analyticsProvider !== "ga" || Boolean(s.analyticsId),
  navigation: (s) => (s.navItems?.length ?? 0) > 0,
  layout: (s) => Boolean(s.headerPageId && s.footerPageId),
  "home-page": (s) => Boolean(s.homePageId),
  "checkout-page": (s) => Boolean(s.checkoutPageId),
  "shop-page": (s) => Boolean(s.shopPageId),
  "product-page": (s) => Boolean(s.productPageId),
  "additional-pages": (s) =>
    Array.isArray(s.pages) && s.pages.every((p) => p.slug.trim().length > 0),
  inventory: (s) => typeof s.inventoryTracking !== "undefined",
  "env-vars": (s) => Object.values(s.env).some(Boolean),
  "import-data": (s) => Boolean(s.categoriesText),
  "seed-data": (s) => Boolean(s.categoriesText),
  summary: (s) => {
    const titles = Object.values(s.pageTitle ?? {});
    const descriptions = Object.values(s.pageDescription ?? {});
    return (
      titles.length > 0 &&
      descriptions.length > 0 &&
      titles.every(
        (value) => typeof value === "string" && value.trim().length > 0
      ) &&
      descriptions.every(
        (value) => typeof value === "string" && value.trim().length > 0
      )
    );
  },
  hosting: (s) => Boolean(s.domain),
};

export function useStepCompletion(stepId: string): [boolean, (v: boolean) => void] {
  const { state, markStepComplete, resetDirty } = useConfigurator();
  const validate = validators[stepId] ?? (() => true);
  const completed = state.completed[stepId] === "complete" && validate(state);
  const setCompleted = (v: boolean) => {
    if (v && !validate(state)) return;
    markStepComplete(stepId, v ? "complete" : "pending");
    if (v) resetDirty();
  };
  return [completed, setCompleted];
}

export default useStepCompletion;
