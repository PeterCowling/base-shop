import { track } from "@acme/telemetry";

import type { ConfiguratorState } from "../../wizard/schema";
import { useConfigurator } from "../ConfiguratorContext";

type Validator = (state: ConfiguratorState) => boolean;

export const validators: Record<string, Validator> = {
  "shop-type": (s) => Boolean(s.type),
  "shop-details": (s) => Boolean(s.shopId && s.storeName),
  "shop-identity": (s) => Boolean(s.shopId && s.storeName && s.locale && s.currency),
  theme: (s) => Boolean(s.theme),
  "theme-brand": (s) => {
    const logo =
      typeof s.logo === "string"
        ? s.logo
        : Object.values(s.logo ?? {})[0];
    return Boolean(s.theme && logo && s.favicon && s.socialImage);
  },
  tokens: (s) => Object.keys(s.themeDefaults ?? {}).length > 0,
  // Validate analytics setup under the Payment Provider step (GA requires Measurement ID)
  "payment-provider": (s) =>
    s.analyticsProvider !== "ga" || Boolean(s.analyticsId),
  navigation: (s) => (s.navItems?.length ?? 0) > 0,
  layout: (s) => Boolean(s.headerPageId && s.footerPageId),
  "home-page": (s) =>
    Boolean(s.homeLayout && s.homeLayout.trim().length > 0 && s.homePageId),
  "checkout-page": (s) =>
    Boolean(
      s.checkoutLayout &&
        s.checkoutLayout.trim().length > 0 &&
        s.checkoutPageId &&
        s.completed?.["payment-provider"] === "complete" &&
        s.completed?.shipping === "complete",
    ),
  "shop-page": (s) => Boolean(s.shopPageId),
  "product-page": (s) =>
    Boolean(
      s.productLayout &&
        s.productLayout.trim().length > 0 &&
        s.productPageId,
    ),
  "additional-pages": (s) =>
    Array.isArray(s.pages) && s.pages.every((p) => p.slug.trim().length > 0),
  inventory: (s) => typeof s.inventoryTracking !== "undefined",
  products: (s) => (s.rapidLaunchProductIds?.length ?? 0) > 0,
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
  commerce: (s) =>
    Boolean(s.paymentTemplateId && s.shippingTemplateId && s.taxTemplateId),
  compliance: (s) =>
    Boolean(
      s.legalBundleId &&
        s.consentTemplateId &&
        Object.values(s.pageTitle ?? {}).some(
          (value) => typeof value === "string" && value.trim().length > 0,
        ) &&
        Object.values(s.pageDescription ?? {}).some(
          (value) => typeof value === "string" && value.trim().length > 0,
        )
    ),
  hosting: (s) => Boolean(s.domain),
};

export function useStepCompletion(stepId: string): [boolean, (v: boolean) => void] {
  const { state, markStepComplete, resetDirty } = useConfigurator();
  const validate = validators[stepId] ?? (() => true);
  const completed = state.completed[stepId] === "complete" && validate(state);
  const setCompleted = (v: boolean) => {
    if (v && !validate(state)) return;
    markStepComplete(stepId, v ? "complete" : "pending");
    if (v && state.shopId) {
      track("build_flow_step_complete", {
        shopId: state.shopId,
        stepId,
      });
    }
    if (v) resetDirty();
  };
  return [completed, setCompleted];
}

export default useStepCompletion;
