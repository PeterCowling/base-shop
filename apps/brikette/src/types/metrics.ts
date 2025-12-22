// src/types/metrics.ts
/**
 * Canonical type definitions for the performance / RUM domain.
 * All code (browser, worker, analytics) should import from here
 * ─ either directly or via the public re-export in `./performance.ts`.
 */

/** Web-vital names we actively track */
export type VitalName = "LCP" | "CLS" | "INP";

/** Rating buckets used by Core Web Vitals */
export type VitalRating = "good" | "needs-improvement" | "poor";

/**
 * Shape of a Web Vital metric as produced by the `web-vitals` package,
 * extended with optional fields that some collectors emit.
 */
export interface WebVitalMetric {
  /** Identifier of the metric (e.g. "LCP") */
  name: VitalName;
  /** Unique metric instance id, e.g. "v3-1653590543044-0.295" */
  id?: string;
  /** Raw numeric value */
  value: number;
  /** Delta since the previous report (optional) */
  delta?: number;
  /** CWV rating bucket */
  rating: VitalRating;
  /** Navigation type that produced the metric (optional in worker context) */
  navigationType?: PerformanceNavigationTiming["type"] | string;
  /** Extra attribution details (CLS sources, INP selector, etc.) */
  attribution?: Record<string, unknown>;
}

/** Cloudflare Worker bindings namespace – extend as needed */
export type Env = Record<string, unknown>; // KV namespaces, D1, R2, secrets, etc.
