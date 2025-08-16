import { coreEnv } from "@acme/config/env/core";

/**
 * Centralized feature flags for luxury modules.
 * Defaults ensure features are disabled unless explicitly enabled.
 */
export const features = {
  /** Enable Return Authorization (RA) ticketing UI */
  raTicketing: coreEnv.LUXURY_FEATURES_RA_TICKETING ?? false,
  /** Minimum deposit amount before a manual fraud review is triggered */
  fraudReviewThreshold: Number(
    coreEnv.LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD ?? 0,
  ),
  /** Require Strong Customer Authentication (3DS) for high-risk payments */
  requireStrongCustomerAuth:
    coreEnv.LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH ?? false,
};

export type Features = typeof features;
