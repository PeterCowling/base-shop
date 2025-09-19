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

describe("shipping provider key requirements", () => {
  it("reports missing UPS_KEY when SHIPPING_PROVIDER is ups", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const errorSpy = spyOnConsoleError();
    expect(() => loadShippingEnv({ SHIPPING_PROVIDER: "ups" })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: {
          _errors: ["UPS_KEY is required when SHIPPING_PROVIDER=ups"],
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("reports missing DHL_KEY when SHIPPING_PROVIDER is dhl", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const errorSpy = spyOnConsoleError();
    expect(() => loadShippingEnv({ SHIPPING_PROVIDER: "dhl" })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DHL_KEY: {
          _errors: ["DHL_KEY is required when SHIPPING_PROVIDER=dhl"],
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("allows ups when UPS_KEY provided", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const env = loadShippingEnv({
      SHIPPING_PROVIDER: "ups",
      UPS_KEY: "abc",
    });
    expect(env).toMatchObject({ SHIPPING_PROVIDER: "ups", UPS_KEY: "abc" });
  });

  it("allows dhl when DHL_KEY provided", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const env = loadShippingEnv({
      SHIPPING_PROVIDER: "dhl",
      DHL_KEY: "def",
    });
    expect(env).toMatchObject({ SHIPPING_PROVIDER: "dhl", DHL_KEY: "def" });
  });

  it("allows other providers without extra keys", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const env = loadShippingEnv({ SHIPPING_PROVIDER: "shippo" });
    expect(env.SHIPPING_PROVIDER).toBe("shippo");
  });
});
