export type ConfiguratorStepId =
  | "shop-basics"
  | "theme"
  | "payments"
  | "shipping-tax"
  | "checkout"
  | "products-inventory"
  | "navigation-home"
  | "domains"
  | "reverse-logistics"
  | "advanced-seo";

export type StepStatus = "pending" | "in-progress" | "complete" | "error";

export interface ConfiguratorProgress {
  shopId: string;
  steps: Record<ConfiguratorStepId, StepStatus>;
  lastUpdated: string;
  errors?: Partial<Record<ConfiguratorStepId, string>>;
}

