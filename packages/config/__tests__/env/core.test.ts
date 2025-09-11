import { describe, it, expect } from "@jest/globals";
import { withEnv } from "../../test/utils/withEnv";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
  EMAIL_FROM: "from@example.com",
};

describe("@acme/config/env/core", () => {
  describe("requireEnv", () => {
    it("throws for missing variable", async () => {
      await withEnv({}, async () => {
        const { requireEnv } = await import("@acme/config/env/core");
        expect(() => requireEnv("MISSING"))
          .toThrow("MISSING is required");
      });
    });

    it("parses booleans", async () => {
      await withEnv({ BOOL: "true" }, async () => {
        const { requireEnv } = await import("@acme/config/env/core");
        expect(requireEnv("BOOL", "boolean")).toBe(true);
      });
      await withEnv({ BOOL: "false" }, async () => {
        const { requireEnv } = await import("@acme/config/env/core");
        expect(requireEnv("BOOL", "boolean")).toBe(false);
      });
      await withEnv({ BOOL: "bad" }, async () => {
        const { requireEnv } = await import("@acme/config/env/core");
        expect(() => requireEnv("BOOL", "boolean")).toThrow(
          "BOOL must be a boolean",
        );
      });
    });

    it("parses numbers", async () => {
      await withEnv({ NUM: "5" }, async () => {
        const { requireEnv } = await import("@acme/config/env/core");
        expect(requireEnv("NUM", "number")).toBe(5);
      });
      await withEnv({ NUM: "bad" }, async () => {
        const { requireEnv } = await import("@acme/config/env/core");
        expect(() => requireEnv("NUM", "number")).toThrow(
          "NUM must be a number",
        );
      });
    });
  });

  describe("depositReleaseEnvRefinement", () => {
    it("validates deposit and reverse logistics variables", async () => {
      await withEnv(baseEnv, async () => {
        const { coreEnvSchema } = await import("@acme/config/env/core");
        const badEnabled = coreEnvSchema.safeParse({
          ...baseEnv,
          DEPOSIT_RELEASE_ENABLED: "maybe",
        });
        expect(badEnabled.success).toBe(false);

        const badInterval = coreEnvSchema.safeParse({
          ...baseEnv,
          REVERSE_LOGISTICS_INTERVAL_MS: "abc",
        });
        expect(badInterval.success).toBe(false);

        const good = coreEnvSchema.safeParse({
          ...baseEnv,
          DEPOSIT_RELEASE_ENABLED: "true",
          REVERSE_LOGISTICS_INTERVAL_MS: "1000",
        });
        expect(good.success).toBe(true);
      });
    });
  });

  describe("AUTH_TOKEN_TTL normalization", () => {
    it.each([
      [60, 15 * 60],
      ["", 15 * 60],
      ["60", 60],
      ["5m", 300],
      ["5 s", 5],
    ])("normalizes %p to %p seconds", async (raw, expected) => {
      await withEnv(baseEnv, async () => {
        const { coreEnvSchema } = await import("@acme/config/env/core");
        const result = coreEnvSchema.safeParse({
          ...baseEnv,
          AUTH_TOKEN_TTL: raw as any,
        });
        expect(result.success).toBe(true);
        expect(result.data.AUTH_TOKEN_TTL).toBe(expected);
      });
    });
  });

  describe("loadCoreEnv", () => {
    it("throws with error lines for invalid env", async () => {
      await withEnv({}, async () => {
        const { loadCoreEnv } = await import("@acme/config/env/core");
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        expect(() =>
          loadCoreEnv({
            CMS_SPACE_URL: "not-a-url",
            CMS_ACCESS_TOKEN: "token",
            SANITY_API_VERSION: "v1",
          } as any),
        ).toThrow("Invalid core environment variables");
        expect(spy.mock.calls[0][0]).toMatch(
          /Invalid core environment variables/, // first line
        );
        expect(
          spy.mock.calls.some((c) => c.join(" ").includes("CMS_SPACE_URL")),
        ).toBe(true);
        spy.mockRestore();
      });
    });

    it("returns parsed object for valid env", async () => {
      await withEnv({}, async () => {
        const { loadCoreEnv } = await import("@acme/config/env/core");
        const parsed = loadCoreEnv(baseEnv as any);
        expect(parsed).toMatchObject(baseEnv);
      });
    });
  });

  describe("lazy proxy", () => {
    it("parses once and caches result", async () => {
      await withEnv(baseEnv, async () => {
        const mod = await import("@acme/config/env/core");
        const spy = jest.spyOn(mod, "loadCoreEnv");
        expect(spy).not.toHaveBeenCalled();
        expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
        expect(spy).toHaveBeenCalledTimes(1);
        // Re-access and access another property
        expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
        expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token");
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
});

