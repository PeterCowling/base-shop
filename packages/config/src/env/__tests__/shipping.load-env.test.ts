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

describe("loadShippingEnv", () => {
  it("parses valid variables", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const errorSpy = spyOnConsoleError();
    const env = loadShippingEnv({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
    expect(env).toEqual({ TAXJAR_KEY: "tax", UPS_KEY: "ups", DHL_KEY: "dhl" });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("parses empty variables", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const errorSpy = spyOnConsoleError();
    const env = loadShippingEnv({});
    expect(env).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it.each([
    {
      name: "UPS_KEY",
      overrides: { UPS_KEY: 123 as unknown as string },
      keys: ["UPS_KEY"],
    },
    {
      name: "TAXJAR_KEY",
      overrides: { TAXJAR_KEY: 456 as unknown as string },
      keys: ["TAXJAR_KEY"],
    },
    {
      name: "DHL_KEY",
      overrides: { DHL_KEY: null as unknown as string },
      keys: ["DHL_KEY"],
    },
    {
      name: "UPS_KEY and DHL_KEY",
      overrides: {
        UPS_KEY: 1 as unknown as string,
        DHL_KEY: 2 as unknown as string,
      },
      keys: ["UPS_KEY", "DHL_KEY"],
    },
  ])("throws when %s is not a string", async ({ overrides, keys }) => {
    const { loadShippingEnv } = await importShippingModule();
    const errorSpy = spyOnConsoleError();
    expect(() => loadShippingEnv(overrides)).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining(
        keys.reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = { _errors: expect.arrayContaining([expect.any(String)]) };
          return acc;
        }, {}),
      ),
    );
    errorSpy.mockRestore();
  });

  it("throws when process.env has invalid variables", async () => {
    const { loadShippingEnv } = await importShippingModule();
    process.env = {
      ...process.env,
      UPS_KEY: 999 as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = spyOnConsoleError();
    expect(() => loadShippingEnv()).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("returns env for valid input", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const env = loadShippingEnv({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
    expect(env).toEqual({ TAXJAR_KEY: "tax", UPS_KEY: "ups", DHL_KEY: "dhl" });
  });
});
