import { describe, expect,it } from "@jest/globals";

import { shippingEnvSchema } from "../shipping.ts";

describe("shipping env matrix", () => {
  describe("SHIPPING_PROVIDER", () => {
    const cases = [
      { name: "none", env: { SHIPPING_PROVIDER: "none" }, ok: true },
      { name: "external", env: { SHIPPING_PROVIDER: "external" }, ok: true },
      { name: "shippo", env: { SHIPPING_PROVIDER: "shippo" }, ok: true },
      {
        name: "ups without key",
        env: { SHIPPING_PROVIDER: "ups" },
        ok: false,
        missing: "UPS_KEY",
      },
      {
        name: "ups with key",
        env: { SHIPPING_PROVIDER: "ups", UPS_KEY: "key" },
        ok: true,
      },
      {
        name: "dhl without key",
        env: { SHIPPING_PROVIDER: "dhl" },
        ok: false,
        missing: "DHL_KEY",
      },
      {
        name: "dhl with key",
        env: { SHIPPING_PROVIDER: "dhl", DHL_KEY: "key" },
        ok: true,
      },
      {
        name: "invalid provider",
        env: { SHIPPING_PROVIDER: "bogus" },
        ok: false,
        missing: "SHIPPING_PROVIDER",
      },
    ] as const;

    it.each(cases)("$name", ({ env, ok, missing }) => {
      const result = shippingEnvSchema.safeParse(env);
      if (ok) {
        expect(result.success).toBe(true);
      } else {
        expect(result.success).toBe(false);
        if (missing) {
          expect(result.error.format()).toEqual(
            expect.objectContaining({
              [missing]: { _errors: expect.arrayContaining([expect.any(String)]) },
            }),
          );
        }
      }
    });
  });

  describe("ALLOWED_COUNTRIES", () => {
    it("parses empty string to undefined", () => {
      expect(
        shippingEnvSchema.parse({ ALLOWED_COUNTRIES: "" }).ALLOWED_COUNTRIES,
      ).toBeUndefined();
    });

    it("splits and normalizes comma list", () => {
      expect(
        shippingEnvSchema.parse({ ALLOWED_COUNTRIES: "US, ca" }).ALLOWED_COUNTRIES,
      ).toEqual(["US", "CA"]);
    });
  });

  describe("LOCAL_PICKUP_ENABLED", () => {
    const cases: Array<[string, boolean]> = [
      ["true", true],
      ["false", false],
      ["yes", true],
      ["0", false],
    ];

    it.each(cases)("parses %s", (val, expected) => {
      expect(
        shippingEnvSchema.parse({ LOCAL_PICKUP_ENABLED: val }).LOCAL_PICKUP_ENABLED,
      ).toBe(expected);
    });

    it("rejects invalid strings", () => {
      const result = shippingEnvSchema.safeParse({
        LOCAL_PICKUP_ENABLED: "maybe" as any,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("FREE_SHIPPING_THRESHOLD", () => {
    it("accepts 0 and positive numbers", () => {
      expect(
        shippingEnvSchema.parse({ FREE_SHIPPING_THRESHOLD: "0" }).FREE_SHIPPING_THRESHOLD,
      ).toBe(0);
      expect(
        shippingEnvSchema.parse({ FREE_SHIPPING_THRESHOLD: "25" }).FREE_SHIPPING_THRESHOLD,
      ).toBe(25);
    });

    it("rejects negative numbers", () => {
      const result = shippingEnvSchema.safeParse({
        FREE_SHIPPING_THRESHOLD: "-1",
      });
      expect(result.success).toBe(false);
    });
  });
});
