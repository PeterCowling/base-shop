// src/types/performance.ts
/**
 * Public re-export layer for performance-domain types.
 * Keeps feature code imports short (`@/types/performance`)
 * while ensuring there is exactly **one** `WebVitalMetric`
 * definition in the code-base.
 */

export type { Env, VitalName, VitalRating, WebVitalMetric } from "./metrics";
