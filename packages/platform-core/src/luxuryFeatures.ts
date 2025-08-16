import { coreEnv } from "@acme/config/env/core";

export const luxuryFeatures = {
  raTicketing: coreEnv.LUXURY_FEATURES_RA_TICKETING ?? false,
  fraudReviewThreshold: Number(
    coreEnv.LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD ?? 0,
  ),
  requireStrongCustomerAuth:
    coreEnv.LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH ?? false,
  trackingDashboard: coreEnv.LUXURY_FEATURES_TRACKING_DASHBOARD ?? true,
  premierDelivery: coreEnv.LUXURY_FEATURES_PREMIER_DELIVERY ?? false,
};
