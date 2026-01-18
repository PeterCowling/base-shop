import { describe, it, expect, afterEach } from "@jest/globals";
import { withEnv } from "../../../config/test/utils/withEnv";

describe("shipping env", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("parses allowed countries and threshold", async () => {
    const env = await withEnv(
      {
        ALLOWED_COUNTRIES: "us, ca",
        FREE_SHIPPING_THRESHOLD: "75",
        DEFAULT_SHIPPING_ZONE: "domestic",
      },
      async () => {
        const mod = await import("@acme/config/env/shipping");
        return mod.loadShippingEnv();
      },
    );
    expect(env.ALLOWED_COUNTRIES).toEqual(["US", "CA"]);
    expect(env.FREE_SHIPPING_THRESHOLD).toBe(75);
    expect(env.DEFAULT_SHIPPING_ZONE).toBe("domestic");
  });

  it("rejects invalid zone", async () => {
    await expect(
      withEnv(
        { DEFAULT_SHIPPING_ZONE: "moon" },
        async () => {
          const mod = await import("@acme/config/env/shipping");
          return mod.loadShippingEnv();
        },
      ),
    ).rejects.toThrow("Invalid shipping environment variables");
  });

  it("rejects invalid threshold", async () => {
    await expect(
      withEnv(
        { FREE_SHIPPING_THRESHOLD: "abc" },
        async () => {
          const mod = await import("@acme/config/env/shipping");
          return mod.loadShippingEnv();
        },
      ),
    ).rejects.toThrow("Invalid shipping environment variables");
  });

  it("throws during eager parse when env invalid", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { UPS_KEY: 123 as any },
        () => import("@acme/config/env/shipping"),
      ),
    ).rejects.toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalled();
  });
});

