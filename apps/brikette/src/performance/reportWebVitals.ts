// src/performance/reportWebVitals.ts
import { onCLS, onINP, onLCP, type Metric, type ReportOpts } from "web-vitals";

import { WebVitalMetric } from "@/types/performance";
import { GA_MEASUREMENT_ID, IS_PROD } from "@/config/env";

/** POST/Beacon endpoint; adjust to your edge collector / worker */
const ENDPOINT = "/api/rum";

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

  // Cast is safe because `WebVitalMetric` structurally extends `Metric`
  const body = JSON.stringify({ ...(metric as WebVitalMetric), ...opts });
  const { sendBeacon } = navigator;

  // Prefer GA4 when configured and loaded on the page
  if (GA_MEASUREMENT_ID && typeof (window as Window & { gtag?: GTag }).gtag === "function") {
    sendToGA(metric, opts);
    return;
  }

  if (sendBeacon) {
    // Ensure proper content-type so the collector can enforce JSON
    const blob = new Blob([body], { type: "application/json" });
    sendBeacon(ENDPOINT, blob);
  } else {
    fetch(ENDPOINT, {
      body,
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {
      /* Swallow errors – metrics must never crash the app */
    });
  }
};

/** Registers the individual vital callbacks */
export function initWebVitals(): void {
  onLCP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
}
