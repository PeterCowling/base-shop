import { useConfigurator } from "../ConfiguratorContext";
import type { ConfiguratorState, PageInfo } from "../../wizard/schema";

type Validator = (state: ConfiguratorState) => boolean;

export const validators: Record<string, Validator> = {
  "shop-type": (s) => Boolean(s.type),
  "shop-details": (s) => Boolean(s.shopId && s.storeName),
  theme: (s) => Boolean(s.theme),
  tokens: (s) => Object.keys(s.themeDefaults ?? {}).length > 0,
  // Validate analytics setup under the Payment Provider step (GA requires Measurement ID)
  "payment-provider": (s) => s.analyticsProvider !== "ga" || Boolean(s.analyticsId),
  "checkout-page": (s) => Boolean(s.checkoutPageId),
  inventory: (s) => typeof s.inventoryTracking !== "undefined",
  "env-vars": (s) => Object.values(s.env).some(Boolean),
  "import-data": (s) => Boolean(s.categoriesText),
  "seed-data": (s) => Boolean(s.categoriesText),
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
