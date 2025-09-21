/** @jest-environment node */
import { describe, it, expect, jest } from "@jest/globals";
import { withEnv } from "../../config/test/utils/withEnv";

describe("core env", () => {
  it("coerces boolean and number values", async () => {
    await withEnv(
      {
        NODE_ENV: "development",
        DEPOSIT_RELEASE_ENABLED: "true",
        DEPOSIT_RELEASE_INTERVAL_MS: "5000",
      },
      async () => {
        const { loadCoreEnv } = await import("@acme/config/env/core");
        const env = loadCoreEnv();
        expect(env.DEPOSIT_RELEASE_ENABLED).toBe(true);
        expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(5000);
      },
    );
  });

  it("applies defaults outside production", async () => {
    const original = process.env;
    process.env = { ...original, NODE_ENV: "development" };
    delete process.env.CART_COOKIE_SECRET;
    jest.resetModules();
    try {
      const { loadCoreEnv } = await import("@acme/config/env/core");
      const env = loadCoreEnv();
      // In test environment defaults should be provided; current code uses a test-specific secret
      expect(env.CART_COOKIE_SECRET).toBe("test-cart-secret");
    } finally {
      process.env = original;
    }
  });

  it("reports validation errors for malformed values", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          NODE_ENV: "development",
          DEPOSIT_RELEASE_ENABLED: "maybe",
          DEPOSIT_RELEASE_INTERVAL_MS: "oops",
        },
        async () => {
          const { loadCoreEnv } = await import("@acme/config/env/core");
          loadCoreEnv();
        },
      ),
    ).rejects.toThrow("Invalid core environment variables");
    const messages = spy.mock.calls.map((c) => c[0]);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringContaining("DEPOSIT_RELEASE_ENABLED: must be true or false"),
        expect.stringContaining("DEPOSIT_RELEASE_INTERVAL_MS: must be a number"),
      ]),
    );
    spy.mockRestore();
  });
});

describe("requireEnv", () => {
  const loadRequire = async () => (await import("@acme/config/env/core")).requireEnv;

  it("parses booleans and numbers", async () => {
    await withEnv({ BOOL_VAL: "true", NUM_VAL: "42" }, async () => {
      const requireEnv = await loadRequire();
      expect(requireEnv("BOOL_VAL", "boolean")).toBe(true);
      expect(requireEnv("NUM_VAL", "number")).toBe(42);
    });
  });

  it("throws for invalid boolean", async () => {
    await withEnv({ BOOL_VAL: "nope" }, async () => {
      const requireEnv = await loadRequire();
      expect(() => requireEnv("BOOL_VAL", "boolean")).toThrow(
        "BOOL_VAL must be a boolean",
      );
    });
  });
});
