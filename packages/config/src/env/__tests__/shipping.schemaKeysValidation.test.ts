import { describe, expect, it } from "@jest/globals";
import { shippingEnvSchema } from "../shipping.ts";

describe("shipping schema key validation", () => {
  it("adds an issue when UPS_KEY is missing for ups", () => {
    const result = shippingEnvSchema.safeParse({ SHIPPING_PROVIDER: "ups" });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["UPS_KEY"],
          message: "UPS_KEY is required when SHIPPING_PROVIDER=ups",
        }),
      ]),
    );
  });

  it("adds an issue when DHL_KEY is missing for dhl", () => {
    const result = shippingEnvSchema.safeParse({ SHIPPING_PROVIDER: "dhl" });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["DHL_KEY"],
          message: "DHL_KEY is required when SHIPPING_PROVIDER=dhl",
        }),
      ]),
    );
  });

  it("fails with formatted error when UPS_KEY missing", () => {
    const result = shippingEnvSchema.safeParse({ SHIPPING_PROVIDER: "ups" });
    expect(result.success).toBe(false);
    expect(result.error.format()).toEqual(
      expect.objectContaining({
        UPS_KEY: {
          _errors: ["UPS_KEY is required when SHIPPING_PROVIDER=ups"],
        },
      }),
    );
  });

  it("fails with formatted error when DHL_KEY missing", () => {
    const result = shippingEnvSchema.safeParse({ SHIPPING_PROVIDER: "dhl" });
    expect(result.success).toBe(false);
    expect(result.error.format()).toEqual(
      expect.objectContaining({
        DHL_KEY: {
          _errors: ["DHL_KEY is required when SHIPPING_PROVIDER=dhl"],
        },
      }),
    );
  });

  it("succeeds when required keys are present", () => {
    expect(
      shippingEnvSchema.safeParse({
        SHIPPING_PROVIDER: "ups",
        UPS_KEY: "k",
      }).success,
    ).toBe(true);
    expect(
      shippingEnvSchema.safeParse({
        SHIPPING_PROVIDER: "dhl",
        DHL_KEY: "k",
      }).success,
    ).toBe(true);
  });
});

