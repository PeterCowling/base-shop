import * as fs from "node:fs";
import * as path from "node:path";

import type { GrowthStageKey } from "@acme/lib";

export interface GrowthPeriod {
  period_id: string;
  start_date: string;
  end_date: string;
  forecast_id: string;
}

export interface WeeklyGrowthMetrics {
  run_id: string;
  business: string;
  period: GrowthPeriod;
  metrics: Record<GrowthStageKey, Record<string, number | null>>;
  data_quality: {
    missing_metrics: string[];
    assumptions: string[];
  };
  sources: {
    s3_forecast: string | null;
    s10_readout: string | null;
    events: string | null;
  };
}

export interface GrowthMetricsAdapterOptions {
  baseDir?: string;
}

interface StageResult {
  artifacts?: Record<string, string>;
}

interface S3ForecastArtifact {
  targets?: Record<string, number>;
}

interface S10ReadoutArtifact {
  actuals?: Record<string, number>;
  targets?: Record<string, number>;
}

function readJsonFile(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function readNumber(
  payload: Record<string, number>,
  key: string,
): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toWholeCount(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  return Math.round(value);
}

function eurosToCents(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  return Math.round(value * 100);
}

function normalizeRateToBps(
  value: number | null,
  assumptions: string[],
  metricLabel: string,
): number | null {
  if (value === null) {
    return null;
  }

  // v1 contract expects fractions in [0,1]; keep backward-compatible fallbacks.
  if (Math.abs(value) <= 1) {
    return Math.round(value * 10000);
  }

  if (Math.abs(value) <= 100) {
    assumptions.push(`${metricLabel} normalized from percent value (${value}) to bps.`);
    return Math.round(value * 100);
  }

  assumptions.push(`${metricLabel} treated as already-in-bps value (${value}).`);
  return Math.round(value);
}

function collectMissingMetrics(
  metrics: Record<GrowthStageKey, Record<string, number | null>>,
): string[] {
  const missing: string[] = [];
  for (const [stage, stageMetrics] of Object.entries(metrics)) {
    for (const [metricKey, metricValue] of Object.entries(stageMetrics)) {
      if (metricValue === null) {
        missing.push(`${stage}.${metricKey}`);
      }
    }
  }

  return missing.sort();
}

function resolveArtifactPath(
  runDir: string,
  stageResultPath: string,
  artifactKey: string,
): string | null {
  const stageResult = readJsonFile(stageResultPath) as StageResult | null;
  const relativeArtifact = stageResult?.artifacts?.[artifactKey];
  if (!relativeArtifact) {
    return null;
  }

  return path.join(runDir, relativeArtifact);
}

export function getWeeklyGrowthMetrics(
  runId: string,
  business: string,
  period: GrowthPeriod,
  options: GrowthMetricsAdapterOptions = {},
): WeeklyGrowthMetrics {
  const root = options.baseDir ?? process.cwd();
  const runDir = path.join(
    root,
    "docs/business-os/startup-baselines",
    business,
    "runs",
    runId,
  );

  const assumptions: string[] = [];

  const s3StageResultPath = path.join(runDir, "stage-result-S3.json");
  const s10StageResultPath = path.join(runDir, "stage-result-S10.json");
  const s3ForecastPath = resolveArtifactPath(runDir, s3StageResultPath, "forecast");
  const s10ReadoutPath = resolveArtifactPath(runDir, s10StageResultPath, "readout");
  const eventsPath = path.join(runDir, "events.jsonl");

  const s3Forecast =
    (s3ForecastPath ? readJsonFile(s3ForecastPath) : null) as S3ForecastArtifact | null;
  const s10Readout =
    (s10ReadoutPath ? readJsonFile(s10ReadoutPath) : null) as S10ReadoutArtifact | null;

  const actuals = s10Readout?.actuals ?? {};
  const targets = {
    ...(s3Forecast?.targets ?? {}),
    ...(s10Readout?.targets ?? {}),
  };

  const traffic = readNumber(actuals, "traffic");
  const orders = readNumber(actuals, "orders");
  const cvr = readNumber(actuals, "cvr");
  const cac = readNumber(actuals, "cac");
  const aov = readNumber(actuals, "aov");
  const revenue = readNumber(actuals, "revenue");

  const readoutNewCustomers = readNumber(actuals, "new_customers");
  const readoutSpend = readNumber(actuals, "spend");
  const readoutReturnRate = readNumber(actuals, "return_rate_30d");
  const readoutOrdersShipped = readNumber(actuals, "orders_shipped");
  const readoutReturnedOrders = readNumber(actuals, "returned_orders");
  const readoutReferralSessions = readNumber(actuals, "referral_sessions");
  const readoutReferralOrders = readNumber(actuals, "referral_orders");
  const readoutReferralConversionRate = readNumber(
    actuals,
    "referral_conversion_rate",
  );

  const newCustomersCount = toWholeCount(
    readoutNewCustomers ?? orders,
  );
  if (readoutNewCustomers === null && orders !== null) {
    assumptions.push("acquisition.new_customers_count mapped from actuals.orders");
  }

  const spendEurCents =
    eurosToCents(readoutSpend) ??
    (cac !== null && newCustomersCount !== null
      ? eurosToCents(cac * newCustomersCount)
      : null);
  if (readoutSpend === null && cac !== null && newCustomersCount !== null) {
    assumptions.push(
      "acquisition.spend_eur_cents derived from actuals.cac * acquisition.new_customers_count",
    );
  }

  const blendedCacEurCents =
    eurosToCents(cac) ??
    (spendEurCents !== null &&
    newCustomersCount !== null &&
    newCustomersCount > 0
      ? Math.round(spendEurCents / newCustomersCount)
      : null);
  if (cac === null && spendEurCents !== null && newCustomersCount !== null) {
    assumptions.push(
      "acquisition.blended_cac_eur_cents derived from spend_eur_cents / new_customers_count",
    );
  }

  const sessionsCount = toWholeCount(traffic);
  const ordersCount = toWholeCount(orders);
  const sitewideCvrBps =
    normalizeRateToBps(cvr, assumptions, "activation.sitewide_cvr_bps") ??
    (ordersCount !== null && sessionsCount !== null && sessionsCount > 0
      ? Math.round((ordersCount * 10000) / sessionsCount)
      : null);
  if (cvr === null && ordersCount !== null && sessionsCount !== null && sessionsCount > 0) {
    assumptions.push(
      "activation.sitewide_cvr_bps derived from activation.orders_count / activation.sessions_count",
    );
  }

  const grossRevenueEurCents = eurosToCents(revenue);
  const aovEurCents =
    eurosToCents(aov) ??
    (grossRevenueEurCents !== null && ordersCount !== null && ordersCount > 0
      ? Math.round(grossRevenueEurCents / ordersCount)
      : null);
  if (aov === null && grossRevenueEurCents !== null && ordersCount !== null && ordersCount > 0) {
    assumptions.push(
      "revenue.aov_eur_cents derived from revenue.gross_revenue_eur_cents / revenue.orders_count",
    );
  }

  const retentionOrdersShipped = toWholeCount(readoutOrdersShipped);
  const retentionReturnedOrders = toWholeCount(readoutReturnedOrders);
  const returnRate30dBps =
    normalizeRateToBps(readoutReturnRate, assumptions, "retention.return_rate_30d_bps") ??
    (retentionReturnedOrders !== null &&
    retentionOrdersShipped !== null &&
    retentionOrdersShipped > 0
      ? Math.round((retentionReturnedOrders * 10000) / retentionOrdersShipped)
      : null);
  if (
    readoutReturnRate === null &&
    retentionReturnedOrders !== null &&
    retentionOrdersShipped !== null &&
    retentionOrdersShipped > 0
  ) {
    assumptions.push(
      "retention.return_rate_30d_bps derived from retention.returned_orders_count / retention.orders_shipped_count",
    );
  }

  const referralSessionsCount = toWholeCount(readoutReferralSessions);
  const referralOrdersCount = toWholeCount(readoutReferralOrders);
  const referralConversionRateBps =
    normalizeRateToBps(
      readoutReferralConversionRate,
      assumptions,
      "referral.referral_conversion_rate_bps",
    ) ??
    (referralOrdersCount !== null &&
    referralSessionsCount !== null &&
    referralSessionsCount > 0
      ? Math.round((referralOrdersCount * 10000) / referralSessionsCount)
      : null);
  if (
    readoutReferralConversionRate === null &&
    referralOrdersCount !== null &&
    referralSessionsCount !== null &&
    referralSessionsCount > 0
  ) {
    assumptions.push(
      "referral.referral_conversion_rate_bps derived from referral.referral_orders_count / referral.referral_sessions_count",
    );
  }

  const metrics: Record<GrowthStageKey, Record<string, number | null>> = {
    acquisition: {
      spend_eur_cents: spendEurCents,
      new_customers_count: newCustomersCount,
      blended_cac_eur_cents: blendedCacEurCents,
    },
    activation: {
      sessions_count: sessionsCount,
      orders_count: ordersCount,
      sitewide_cvr_bps: sitewideCvrBps,
    },
    revenue: {
      gross_revenue_eur_cents: grossRevenueEurCents,
      orders_count: ordersCount,
      aov_eur_cents: aovEurCents,
    },
    retention: {
      orders_shipped_count: retentionOrdersShipped,
      returned_orders_count: retentionReturnedOrders,
      return_rate_30d_bps: returnRate30dBps,
    },
    referral: {
      referral_sessions_count: referralSessionsCount,
      referral_orders_count: referralOrdersCount,
      referral_conversion_rate_bps: referralConversionRateBps,
    },
  };

  // Keep targets read to preserve source ownership visibility in debugging paths.
  if (Object.keys(targets).length === 0) {
    assumptions.push("No S3/S10 targets found; v1 growth evaluation proceeds on actuals-only metrics.");
  }

  return {
    run_id: runId,
    business,
    period,
    metrics,
    data_quality: {
      missing_metrics: collectMissingMetrics(metrics),
      assumptions: assumptions.sort(),
    },
    sources: {
      s3_forecast: s3ForecastPath ? path.relative(runDir, s3ForecastPath) : null,
      s10_readout: s10ReadoutPath ? path.relative(runDir, s10ReadoutPath) : null,
      events: fs.existsSync(eventsPath) ? "events.jsonl" : null,
    },
  };
}
