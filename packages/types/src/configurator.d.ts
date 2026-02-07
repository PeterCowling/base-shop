export type ConfiguratorStepId = "shop-basics" | "theme" | "payments" | "shipping-tax" | "checkout" | "products-inventory" | "legal" | "navigation-home" | "domains" | "reverse-logistics" | "advanced-seo" | "reach-social";
export type StepStatus = "pending" | "in-progress" | "complete" | "error";
export interface ConfiguratorProgress {
    shopId: string;
    steps: Record<ConfiguratorStepId, StepStatus>;
    lastUpdated: string;
    errors?: Partial<Record<ConfiguratorStepId, string>>;
}
export type LaunchEnv = "dev" | "stage" | "prod";
export type LaunchStatus = "ok" | "blocked" | "warning";
export interface LaunchCheckResult {
    env: LaunchEnv;
    status: LaunchStatus;
    reasons: string[];
}
//# sourceMappingURL=configurator.d.ts.map