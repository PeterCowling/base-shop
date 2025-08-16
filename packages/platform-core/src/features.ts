import { coreEnv } from "@acme/config/env/core";

export const features = {
  /** enable RA ticketing module */
  raTicketing: coreEnv.LUXURY_FEATURES_RA_TICKETING ?? false,
  /** minimum fraud score before manual review */
  fraudReviewThreshold: Number(
    coreEnv.LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD ?? 0,
  ),
  /** require SCA for high value orders */
  requireStrongCustomerAuth:
    coreEnv.LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH ?? false,
  /** dashboards for shipment and return tracking */
  trackingDashboard: coreEnv.LUXURY_FEATURES_TRACKING_DASHBOARD ?? false,
  /** enable return flows */
  returns: coreEnv.LUXURY_FEATURES_RETURNS ?? false,
};

export type Features = typeof features;
