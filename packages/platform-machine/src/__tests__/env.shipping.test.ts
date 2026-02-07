import { describe, expect, it, jest } from "@jest/globals";

import { loadShippingEnv } from "@acme/config/env/shipping";

import { withEnv } from "./helpers/env";

describe("shipping env", () => {
  it("accepts valid zone", () => {
    const env = loadShippingEnv({ DEFAULT_SHIPPING_ZONE: "eu" } as any);
    expect(env.DEFAULT_SHIPPING_ZONE).toBe("eu");
  });

  it("rejects invalid zone", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ DEFAULT_SHIPPING_ZONE: "moon" } as any),
    ).toThrow("Invalid shipping environment variables");
    err.mockRestore();
  });

  it("coerces free shipping threshold", () => {
    const env = loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "25" } as any);
    expect(env.FREE_SHIPPING_THRESHOLD).toBe(25);
  });

  it("rejects invalid thresholds", () => {
    expect(() =>
      loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "soon" } as any),
    ).toThrow("Invalid shipping environment variables");
    expect(() =>
      loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "-1" } as any),
    ).toThrow("Invalid shipping environment variables");
  });

  it("splits and normalizes countries", () => {
    const env = loadShippingEnv({
      ALLOWED_COUNTRIES: "us, ca , mx",
      DEFAULT_COUNTRY: " us ",
    } as any);
    expect(env.ALLOWED_COUNTRIES).toEqual(["US", "CA", "MX"]);
    expect(env.DEFAULT_COUNTRY).toBe("US");
  });

  it("coerces local pickup flag", () => {
    const env = loadShippingEnv({ LOCAL_PICKUP_ENABLED: "1" } as any);
    expect(env.LOCAL_PICKUP_ENABLED).toBe(true);
    expect(() =>
      loadShippingEnv({ LOCAL_PICKUP_ENABLED: "maybe" } as any),
    ).toThrow("Invalid shipping environment variables");
  });

  it("omits optional keys when absent", () => {
    const env = loadShippingEnv({} as any);
    expect(env.TAXJAR_KEY).toBeUndefined();
    expect(env.UPS_KEY).toBeUndefined();
    expect(env.DHL_KEY).toBeUndefined();
  });

  it("eager import validates env", async () => {
    const mod = await withEnv(
      { DEFAULT_SHIPPING_ZONE: "domestic" },
      () => import("@acme/config/env/shipping"),
    );
    expect(mod.shippingEnv.DEFAULT_SHIPPING_ZONE).toBe("domestic");
    await expect(
      withEnv(
        { DEFAULT_SHIPPING_ZONE: "galaxy" },
        () => import("@acme/config/env/shipping"),
      ),
    ).rejects.toThrow("Invalid shipping environment variables");
  });
});
