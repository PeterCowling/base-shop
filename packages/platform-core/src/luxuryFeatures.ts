import { coreEnv } from "@acme/config/env/core";

export const luxuryFeatures = {
  blog: coreEnv.LUXURY_FEATURES_BLOG ?? false,
  raTicketing: coreEnv.LUXURY_FEATURES_RA_TICKETING ?? false,
  fraudReviewThreshold: Number(
    coreEnv.LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD ?? 0,
  ),
  requireStrongCustomerAuth:
    coreEnv.LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH ?? false,
};
