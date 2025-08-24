const env = process.env;

export const features = {
  /** enable RA ticketing module */
  raTicketing:
    (env.NEXT_PUBLIC_LUXURY_FEATURES_RA_TICKETING ??
      env.LUXURY_FEATURES_RA_TICKETING) === "true",
  /** minimum fraud score before manual review */
  fraudReviewThreshold: Number(
    env.NEXT_PUBLIC_LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD ??
      env.LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD ??
      0,
  ),
  /** require SCA for high value orders */
  requireStrongCustomerAuth:
    (env.NEXT_PUBLIC_LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH ??
      env.LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH) === "true",
  /** dashboards for shipment and return tracking */
  trackingDashboard:
    (env.NEXT_PUBLIC_LUXURY_FEATURES_TRACKING_DASHBOARD ??
      env.LUXURY_FEATURES_TRACKING_DASHBOARD) === "true",
  /** enable return requests and label generation */
  returns:
    (env.NEXT_PUBLIC_LUXURY_FEATURES_RETURNS ??
      env.LUXURY_FEATURES_RETURNS) === "true",
};

export type Features = typeof features;
