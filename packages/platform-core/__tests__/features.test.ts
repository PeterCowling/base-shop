/** @jest-environment node */

describe("features flags", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it.each([
    [
      {
        LUXURY_FEATURES_RA_TICKETING: true,
        LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: 3,
        LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH: true,
        LUXURY_FEATURES_TRACKING_DASHBOARD: false,
        LUXURY_FEATURES_RETURNS: true,
      },
      {
        raTicketing: true,
        fraudReviewThreshold: 3,
        requireStrongCustomerAuth: true,
        trackingDashboard: false,
        returns: true,
      },
    ],
    [
      {
        LUXURY_FEATURES_RA_TICKETING: false,
        LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: 8,
        LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH: false,
        LUXURY_FEATURES_TRACKING_DASHBOARD: true,
        LUXURY_FEATURES_RETURNS: false,
      },
      {
        raTicketing: false,
        fraudReviewThreshold: 8,
        requireStrongCustomerAuth: false,
        trackingDashboard: true,
        returns: false,
      },
    ],
  ])("maps env flags to features object", async (env, expected) => {
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => env,
    }));

    const { features } = await import("../src/features");
    expect(features).toEqual(expected);
  });

  it("uses defaults when env missing", async () => {
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({}),
    }));

    const { features } = await import("../src/features");
    expect(features).toEqual({
      raTicketing: false,
      fraudReviewThreshold: 0,
      requireStrongCustomerAuth: false,
      trackingDashboard: false,
      returns: false,
    });
  });
});
