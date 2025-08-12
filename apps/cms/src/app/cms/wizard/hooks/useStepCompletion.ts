import { useWizard } from "../WizardContext";
import type { WizardState } from "../schema";

type Validator = (state: WizardState) => boolean;

export const validators: Record<string, Validator> = {
  "shop-details": (s) => Boolean(s.shopId && s.storeName),
  theme: (s) => Boolean(s.theme),
  tokens: (s) => Object.keys(s.themeVars ?? {}).length > 0,
  options: (s) =>
    s.analyticsProvider !== "ga" || Boolean(s.analyticsId),
  navigation: (s) => s.navItems.length > 0,
  layout: (s) => Boolean(s.headerPageId && s.footerPageId),
  "home-page": (s) => Boolean(s.homePageId),
  "checkout-page": (s) => Boolean(s.checkoutPageId),
  "shop-page": (s) => Boolean(s.shopPageId),
  "product-page": (s) => Boolean(s.productPageId),
  "additional-pages": (s) => s.pages.every((p) => Boolean(p.slug)),
  "env-vars": (s) => Object.values(s.env).some(Boolean),
  summary: (s) =>
    Object.values(s.pageTitle).some(Boolean) &&
    Object.values(s.pageDescription).some(Boolean),
  "import-data": (s) => Boolean(s.categoriesText),
  "seed-data": (s) => Boolean(s.categoriesText),
  hosting: (s) => Boolean(s.domain),
};

export function useStepCompletion(stepId: string): [boolean, (v: boolean) => void] {
  const { state, markStepComplete } = useWizard();
  const validate = validators[stepId] ?? (() => true);
  const completed = state.completed[stepId] === "complete" && validate(state);
  const setCompleted = (v: boolean) => {
    if (v && !validate(state)) return;
    markStepComplete(stepId, v ? "complete" : "pending");
  };
  return [completed, setCompleted];
}

export default useStepCompletion;
