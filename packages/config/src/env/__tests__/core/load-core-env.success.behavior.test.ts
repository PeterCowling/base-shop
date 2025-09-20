/** @jest-environment node */
import { describe, expect, it, jest } from "@jest/globals";
import { loadCoreEnv } from "../../core.ts";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
  EMAIL_FROM: "from@example.com",
};

describe("loadCoreEnv success cases", () => {
  it("returns parsed env on success without logging", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const env = loadCoreEnv({
      ...baseEnv,
      NODE_ENV: "development",
    } as unknown as NodeJS.ProcessEnv);
    expect(env).toMatchObject({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      CART_COOKIE_SECRET: "dev-cart-secret",
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("coerces optional export, phase, luxury and stock alert vars", () => {
    const env = loadCoreEnv({
      ...baseEnv,
      OUTPUT_EXPORT: "true",
      NEXT_PUBLIC_PHASE: "beta",
      LUXURY_FEATURES_RA_TICKETING: "",
      LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: "5",
      LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH: "true",
      LUXURY_FEATURES_TRACKING_DASHBOARD: "",
      LUXURY_FEATURES_RETURNS: "true",
      STOCK_ALERT_RECIPIENTS: "a@a.com,b@b.com",
      STOCK_ALERT_WEBHOOK: "https://example.com/hook",
      STOCK_ALERT_DEFAULT_THRESHOLD: "10",
      STOCK_ALERT_RECIPIENT: "alert@example.com",
    } as unknown as NodeJS.ProcessEnv);
    expect(env).toMatchObject({
      OUTPUT_EXPORT: true,
      NEXT_PUBLIC_PHASE: "beta",
      LUXURY_FEATURES_RA_TICKETING: false,
      LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: 5,
      LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH: true,
      LUXURY_FEATURES_TRACKING_DASHBOARD: false,
      LUXURY_FEATURES_RETURNS: true,
      STOCK_ALERT_RECIPIENTS: "a@a.com,b@b.com",
      STOCK_ALERT_WEBHOOK: "https://example.com/hook",
      STOCK_ALERT_DEFAULT_THRESHOLD: 10,
      STOCK_ALERT_RECIPIENT: "alert@example.com",
    });
  });

  it("parses valid deposit, reverse logistics and late fee vars", () => {
    const env = loadCoreEnv({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "false",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "3000",
    } as unknown as NodeJS.ProcessEnv);
    expect(env).toMatchObject({
      DEPOSIT_RELEASE_ENABLED: true,
      DEPOSIT_RELEASE_INTERVAL_MS: 1000,
      REVERSE_LOGISTICS_ENABLED: false,
      REVERSE_LOGISTICS_INTERVAL_MS: 2000,
      LATE_FEE_ENABLED: true,
      LATE_FEE_INTERVAL_MS: 3000,
    });
  });
});

