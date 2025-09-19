/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  importShippingModule,
  resetShippingEnv,
  spyOnConsoleError,
} from "./shipping.test-helpers";

afterEach(() => {
  resetShippingEnv();
  jest.clearAllMocks();
});

describe("shipping localization options", () => {
  describe("LOCAL_PICKUP_ENABLED parsing", () => {
    it.each([
      ["true", true],
      ["1", true],
      ["yes", true],
      ["false", false],
      ["0", false],
      ["no", false],
      [" TrUe ", true],
      [" NO ", false],
    ])("coerces %p to %p", async (input, expected) => {
      const { loadShippingEnv } = await importShippingModule();
      const env = loadShippingEnv({ LOCAL_PICKUP_ENABLED: input });
      expect(env.LOCAL_PICKUP_ENABLED).toBe(expected);
    });

    it("rejects invalid boolean strings", async () => {
      const { loadShippingEnv } = await importShippingModule();
      const errorSpy = spyOnConsoleError();
      expect(() =>
        loadShippingEnv({ LOCAL_PICKUP_ENABLED: "maybe" as unknown as string }),
      ).toThrow("Invalid shipping environment variables");
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid shipping environment variables:",
        expect.objectContaining({
          LOCAL_PICKUP_ENABLED: {
            _errors: [expect.stringContaining("must be a boolean")],
          },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  describe("ALLOWED_COUNTRIES transformation", () => {
    it.each([
      ["", undefined],
      ["US,ca, mx", ["US", "CA", "MX"]],
    ])("parses %p", async (input, expected) => {
      const { loadShippingEnv } = await importShippingModule();
      const env = loadShippingEnv({ ALLOWED_COUNTRIES: input });
      expect(env.ALLOWED_COUNTRIES).toEqual(expected as unknown);
    });
  });

  describe("DEFAULT_COUNTRY validation", () => {
    it.each([
      ["us", "US"],
      ["CA", "CA"],
    ])("accepts %p", async (input, expected) => {
      const { loadShippingEnv } = await importShippingModule();
      const env = loadShippingEnv({ DEFAULT_COUNTRY: input });
      expect(env.DEFAULT_COUNTRY).toBe(expected);
    });

    it.each(["USA", "1A", "u"])('rejects %p', async (input) => {
      const { loadShippingEnv } = await importShippingModule();
      const errorSpy = spyOnConsoleError();
      expect(() => loadShippingEnv({ DEFAULT_COUNTRY: input as unknown as string })).toThrow(
        "Invalid shipping environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid shipping environment variables:",
        expect.objectContaining({
          DEFAULT_COUNTRY: {
            _errors: [expect.stringContaining("2-letter country code")],
          },
        }),
      );
      errorSpy.mockRestore();
    });
  });
});
