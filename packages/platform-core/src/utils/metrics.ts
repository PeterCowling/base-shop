import { logger } from "./logger";
import type { LogMeta } from "./logger";

export type MetricStatus = "success" | "failure" | "skipped" | "invalid-config";

export interface MetricLabels extends LogMeta {
  shopId?: string;
  env?: "dev" | "stage" | "prod";
  service?: string;
  status?: MetricStatus;
}

const ENV_LABEL: "dev" | "stage" | "prod" =
  process.env.NODE_ENV === "production" ? "prod" : "dev";

export function recordMetric(
  name: string,
  labels: MetricLabels = {},
  value?: number,
): void {
  const meta: MetricLabels = {
    metric: name,
    env: ENV_LABEL,
    ...labels,
  };
  if (typeof value === "number") {
    (meta as MetricLabels & { value: number }).value = value;
  }
  logger.info("metric", meta);
}

