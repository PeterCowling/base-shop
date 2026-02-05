// src/performance/reportWebVitals.ts
import { type Metric, onCLS, onINP, onLCP, type ReportOpts } from "web-vitals";

import { GA_MEASUREMENT_ID, IS_PROD } from "@/config/env";

type GTag = (...args: unknown[]) => void;

function sendToGA(metric: Metric, opts?: ReportOpts): void {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: GTag }).gtag;
  if (!gtag || !GA_MEASUREMENT_ID) return;

  // GA4 prefers integer values; scale CLS for readability if desired
  const intValue = Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value);
  try {
    gtag("event", "web_vitals", {
      name: metric.name,
      value: intValue,
      // Helpful custom params (register in GA4 custom dims/metrics for reporting)
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      navigation_type: metric.navigationType,
      // Non-interaction keeps bounce intact
      non_interaction: true,
      // Pass-through of any report options
      ...(opts || {}),
    });
  } catch {
    // Swallow – never fail vitals
  }
}

/**
 * Sends Web-Vitals metrics to the collector.
 * Uses `navigator.sendBeacon` when available to avoid blocking
 * the page unload, with a `fetch` fallback for older browsers.
 */
const sendToAnalytics = (metric: Metric, opts?: ReportOpts): void => {
  // Avoid noise in dev / test environments
  if (!IS_PROD) return;

  // GA-only: only emit when GA is configured and loaded on the page.
  if (GA_MEASUREMENT_ID && typeof (window as Window & { gtag?: GTag }).gtag === "function") {
    sendToGA(metric, opts);
  }
};

/** Registers the individual vital callbacks */
export function initWebVitals(): void {
  onLCP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
}
