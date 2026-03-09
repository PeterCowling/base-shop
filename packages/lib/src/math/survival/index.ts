/**
 * Survival Module - Time-to-event primitives backed by Kaplan-Meier estimation.
 *
 * This gives the repo a centralized survival-analysis entry point without
 * forcing startup-loop code to depend on package-specific APIs directly.
 */

export type { KaplanMeierEstimatorResult } from "@fullstax/kaplan-meier-estimator";
export {
  compute as kaplanMeierEstimate,
} from "@fullstax/kaplan-meier-estimator";
