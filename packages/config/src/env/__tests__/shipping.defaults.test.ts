/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  importShippingModule,
  resetShippingEnv,
  spyOnConsoleError,
  withShippingEnv,
} from "./shipping.test-helpers";

afterEach(() => {
  resetShippingEnv();
  jest.clearAllMocks();
});

describe("shipping env defaults and options", () => {
  it("includes carriers when env vars are set", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const env = loadShippingEnv({
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
    expect(env).toEqual({ UPS_KEY: "ups", DHL_KEY: "dhl" });
  });

  it("omits carriers when env vars are missing", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const env = loadShippingEnv({});
    expect(env).toEqual({});
    expect(env).not.toHaveProperty("UPS_KEY");
    expect(env).not.toHaveProperty("DHL_KEY");
  });

  it("defaults carrier keys to undefined when optional vars are absent", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const env = loadShippingEnv({});
    expect(env.UPS_KEY).toBeUndefined();
    expect(env.DHL_KEY).toBeUndefined();
  });

  describe("DEFAULT_SHIPPING_ZONE selection", () => {
    it.each([
      ["domestic", "domestic"],
      ["eu", "eu"],
      ["international", "international"],
      [undefined, "domestic"],
    ])("returns %s", async (zone, expected) => {
      const { loadShippingEnv } = await importShippingModule();
      const env = loadShippingEnv(
        zone ? { DEFAULT_SHIPPING_ZONE: zone } : {},
      );
      expect(env.DEFAULT_SHIPPING_ZONE ?? "domestic").toBe(expected);
    });
  });

  it("throws on invalid DEFAULT_SHIPPING_ZONE", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const errorSpy = spyOnConsoleError();
    expect(() =>
      loadShippingEnv({
        DEFAULT_SHIPPING_ZONE: "mars" as unknown as "domestic",
      }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DEFAULT_SHIPPING_ZONE: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("applies FREE_SHIPPING_THRESHOLD correctly", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const env = loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "50" });
    const qualifies = (amount: number) =>
      env.FREE_SHIPPING_THRESHOLD !== undefined &&
      amount >= env.FREE_SHIPPING_THRESHOLD;
    expect(qualifies(49)).toBe(false);
    expect(qualifies(50)).toBe(true);
    expect(qualifies(51)).toBe(true);
  });

  it("handles missing and invalid FREE_SHIPPING_THRESHOLD", async () => {
    const { loadShippingEnv } = await importShippingModule();
    const env = loadShippingEnv({});
    const qualifies = (amount: number) =>
      env.FREE_SHIPPING_THRESHOLD !== undefined &&
      amount >= env.FREE_SHIPPING_THRESHOLD;
    expect(env.FREE_SHIPPING_THRESHOLD).toBeUndefined();
    expect(qualifies(100)).toBe(false);

    const errorSpy = spyOnConsoleError();
    expect(() =>
      loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "abc" as unknown as string }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        FREE_SHIPPING_THRESHOLD: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });

  describe("withShippingEnv helper", () => {
    it.each([
      ["domestic", "domestic"],
      ["eu", "eu"],
      ["international", "international"],
      [undefined, "domestic"],
    ])("returns %s", async (zone, expected) => {
      await withShippingEnv(
        zone ? ({ DEFAULT_SHIPPING_ZONE: zone } as NodeJS.ProcessEnv) : {},
        (load) => {
          const env = load();
          expect(env.DEFAULT_SHIPPING_ZONE ?? "domestic").toBe(expected);
        },
      );
    });

    it("applies FREE_SHIPPING_THRESHOLD around the limit", async () => {
      await withShippingEnv(
        { FREE_SHIPPING_THRESHOLD: "75" } as NodeJS.ProcessEnv,
        (load) => {
          const env = load();
          const qualifies = (amount: number) =>
            env.FREE_SHIPPING_THRESHOLD !== undefined &&
            amount >= env.FREE_SHIPPING_THRESHOLD;
          expect(qualifies(74)).toBe(false);
          expect(qualifies(75)).toBe(true);
          expect(qualifies(76)).toBe(true);
        },
      );
    });

    it.each([
      [{ UPS_KEY: 123 as unknown as string }, "UPS_KEY"],
      [{ DHL_KEY: 456 as unknown as string }, "DHL_KEY"],
      [{ FREE_SHIPPING_THRESHOLD: "abc" as unknown as string }, "FREE_SHIPPING_THRESHOLD"],
      [{ DEFAULT_SHIPPING_ZONE: "mars" as unknown as string }, "DEFAULT_SHIPPING_ZONE"],
    ])("throws on malformed %s", async (envVars, key) => {
      await withShippingEnv(envVars as NodeJS.ProcessEnv, (load) => {
        const errorSpy = spyOnConsoleError();
        expect(() => load()).toThrow("Invalid shipping environment variables");
        expect(errorSpy).toHaveBeenCalledWith(
          "❌ Invalid shipping environment variables:",
          expect.objectContaining({
            [key]: { _errors: expect.arrayContaining([expect.any(String)]) },
          }),
        );
        errorSpy.mockRestore();
      });
    });
  });
});
