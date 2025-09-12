/** @jest-environment node */
import { describe, it, expect, jest } from "@jest/globals";
import { shippingEnvSchema, loadShippingEnv } from "../shipping.ts";

describe("shippingEnvSchema refinements", () => {
  it("converts ALLOWED_COUNTRIES to uppercase array", () => {
    const parsed = shippingEnvSchema.safeParse({
      ALLOWED_COUNTRIES: "us, ca ,de",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.ALLOWED_COUNTRIES).toEqual(["US", "CA", "DE"]);
    }
  });

  it("returns undefined for empty ALLOWED_COUNTRIES", () => {
    const parsed = shippingEnvSchema.safeParse({ ALLOWED_COUNTRIES: "" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.ALLOWED_COUNTRIES).toBeUndefined();
    }
  });

  describe("LOCAL_PICKUP_ENABLED", () => {
    it.each([
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
      ["yes", true],
    ])("parses %s", (input, expected) => {
      const parsed = shippingEnvSchema.safeParse({
        LOCAL_PICKUP_ENABLED: input,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.LOCAL_PICKUP_ENABLED).toBe(expected);
      }
    });

    it("fails on invalid value", () => {
      const parsed = shippingEnvSchema.safeParse({
        LOCAL_PICKUP_ENABLED: "maybe",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("DEFAULT_COUNTRY", () => {
    it("trims and uppercases", () => {
      const parsed = shippingEnvSchema.safeParse({
        DEFAULT_COUNTRY: " us ",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.DEFAULT_COUNTRY).toBe("US");
      }
    });

    it("rejects invalid codes", () => {
      const parsed = shippingEnvSchema.safeParse({
        DEFAULT_COUNTRY: "USA",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("provider requirements", () => {
    it("errors when UPS_KEY missing for ups", () => {
      const parsed = shippingEnvSchema.safeParse({
        SHIPPING_PROVIDER: "ups",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ["UPS_KEY"] }),
          ]),
        );
      }
    });

    it("errors when DHL_KEY missing for dhl", () => {
      const parsed = shippingEnvSchema.safeParse({
        SHIPPING_PROVIDER: "dhl",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ["DHL_KEY"] }),
          ]),
        );
      }
    });
  });

  it("loadShippingEnv throws on invalid input", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ DEFAULT_COUNTRY: "USA" } as any)
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
