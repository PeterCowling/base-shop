/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  importShippingModule,
  resetShippingEnv,
  setShippingEnv,
  spyOnConsoleError,
} from "./shipping.test-helpers";

afterEach(() => {
  resetShippingEnv();
  jest.clearAllMocks();
});

describe("shipping env eager parse", () => {
  it("imports shipping.ts without error when env is valid", async () => {
    setShippingEnv({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    } as NodeJS.ProcessEnv);
    const errorSpy = spyOnConsoleError();
    const mod = await importShippingModule();
    expect(mod.shippingEnv).toEqual({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it.each([
    {
      name: "UPS_KEY number",
      overrides: { UPS_KEY: 123 as unknown as string },
      key: "UPS_KEY",
    },
    {
      name: "DHL_KEY number",
      overrides: { DHL_KEY: 456 as unknown as string },
      key: "DHL_KEY",
    },
    {
      name: "TAXJAR_KEY number",
      overrides: { TAXJAR_KEY: 789 as unknown as string },
      key: "TAXJAR_KEY",
    },
    {
      name: "DHL_KEY null",
      overrides: { DHL_KEY: null as unknown as string },
      key: "DHL_KEY",
    },
    {
      name: "LOCAL_PICKUP_ENABLED boolean",
      overrides: { LOCAL_PICKUP_ENABLED: true as unknown as string },
      key: "LOCAL_PICKUP_ENABLED",
    },
    {
      name: "FREE_SHIPPING_THRESHOLD number",
      overrides: { FREE_SHIPPING_THRESHOLD: 10 as unknown as string },
      key: "FREE_SHIPPING_THRESHOLD",
    },
  ])("throws when %s is not a string", async ({ overrides, key }) => {
    setShippingEnv(overrides as NodeJS.ProcessEnv);
    const errorSpy = spyOnConsoleError();
    await expect(importShippingModule()).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        [key]: { _errors: ["Expected string"] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when process.env mixes valid and invalid keys", async () => {
    setShippingEnv({
      TAXJAR_KEY: "tax",
      UPS_KEY: 123 as unknown as string,
    } as NodeJS.ProcessEnv);
    const errorSpy = spyOnConsoleError();
    await expect(importShippingModule()).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: ["Expected string"] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("reports multiple invalid keys during eager parse", async () => {
    setShippingEnv({
      UPS_KEY: 123 as unknown as string,
      DHL_KEY: 456 as unknown as string,
    } as NodeJS.ProcessEnv);
    const errorSpy = spyOnConsoleError();
    await expect(importShippingModule()).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: ["Expected string"] },
        DHL_KEY: { _errors: ["Expected string"] },
      }),
    );
    errorSpy.mockRestore();
  });
});
