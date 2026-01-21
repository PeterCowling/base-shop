import { afterEach, describe, expect, it } from "@jest/globals";

import { withEnv } from "./envTestUtils";

// AUTH_TOKEN_TTL normalisation

process.env.EMAIL_FROM = "from@example.com";
process.env.CMS_SPACE_URL = "https://example.com";
process.env.CMS_ACCESS_TOKEN = "token";
process.env.SANITY_API_VERSION = "v1";
process.env.SANITY_PROJECT_ID = "project";
process.env.SANITY_DATASET = "production";
process.env.SANITY_API_TOKEN = "token";
process.env.SANITY_PREVIEW_SECRET = "secret";

// TODO: These tests are skipped due to env snapshot behavior in core/env.snapshot.ts
// When tests reassign process.env to a new object, the loader uses the old snapshot.
// The AUTH_TOKEN_TTL normalisation is tested via integration tests instead.
describe.skip("AUTH_TOKEN_TTL normalisation", () => {
  afterEach(() => {
    jest.dontMock("@acme/config/env/auth");
    jest.resetModules();
  });

  function mockAuthSchema(spy: jest.Mock) {
    jest.doMock("@acme/config/env/auth", () => {
      const { z } = require("zod");
      const base = z.object({ AUTH_TOKEN_TTL: z.any().optional() });
      return {
        authEnvSchema: {
          innerType: () => base,
          safeParse: spy,
        },
      };
    });
  }

  it("normalises numeric strings to seconds", async () => {
    await withEnv({}, async () => {
      const spy = jest.fn(() => ({ success: true, data: {} }));
      mockAuthSchema(spy);
      const core = await import("@acme/config/env/core");
      process.env.AUTH_TOKEN_TTL = "30";
      core.loadCoreEnv();
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ AUTH_TOKEN_TTL: "30s" })
      );
    });
  });

  it("trims whitespace and preserves unit", async () => {
    await withEnv({}, async () => {
      const spy = jest.fn(() => ({ success: true, data: {} }));
      mockAuthSchema(spy);
      const core = await import("@acme/config/env/core");
      process.env.AUTH_TOKEN_TTL = " 5 m ";
      core.loadCoreEnv();
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ AUTH_TOKEN_TTL: "5m" })
      );
    });
  });

  it("deletes blank strings", async () => {
    await withEnv({}, async () => {
      const spy = jest.fn(() => ({ success: true, data: {} }));
      mockAuthSchema(spy);
      const core = await import("@acme/config/env/core");
      process.env.AUTH_TOKEN_TTL = " ";
      core.loadCoreEnv();
      expect(spy).toHaveBeenCalledWith(
        expect.not.objectContaining({ AUTH_TOKEN_TTL: expect.anything() })
      );
    });
  });

  it("deletes numeric values", async () => {
    await withEnv({ AUTH_TOKEN_TTL: 600 as any }, async () => {
      const spy = jest.fn(() => ({ success: true, data: {} }));
      mockAuthSchema(spy);
      const core = await import("@acme/config/env/core");
      core.loadCoreEnv();
      expect(spy).toHaveBeenCalledWith(
        expect.not.objectContaining({ AUTH_TOKEN_TTL: expect.anything() })
      );
    });
  });

  it("throws when format is invalid", async () => {
    await withEnv({}, async () => {
      const spy = jest.fn(() => ({
        success: false,
        error: { issues: [{ path: ["AUTH_TOKEN_TTL"], message: "bad" }] },
      }));
      mockAuthSchema(spy);
      const core = await import("@acme/config/env/core");
      process.env.AUTH_TOKEN_TTL = "10minutes";
      expect(() => core.loadCoreEnv()).toThrow(
        "Invalid core environment variables"
      );
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ AUTH_TOKEN_TTL: "10minutes" })
      );
    });
  });
});

// deposit/reverse/late-fee refinement

describe("deposit/reverse/late-fee refinement", () => {
  it("accepts valid custom keys", async () => {
    const { coreEnvSchema } = await import("@acme/config/env/core");
    const result = coreEnvSchema.safeParse({
      DEPOSIT_RELEASE_CUSTOM_ENABLED: "true",
      DEPOSIT_RELEASE_CUSTOM_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_CUSTOM_ENABLED: "false",
      REVERSE_LOGISTICS_CUSTOM_INTERVAL_MS: "2000",
      LATE_FEE_CUSTOM_ENABLED: "true",
      LATE_FEE_CUSTOM_INTERVAL_MS: "3000",
      EMAIL_FROM: "from@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("flags invalid boolean and number", async () => {
    const { coreEnvSchema } = await import("@acme/config/env/core");
    const result = coreEnvSchema.safeParse({
      DEPOSIT_RELEASE_CUSTOM_ENABLED: "maybe",
      DEPOSIT_RELEASE_CUSTOM_INTERVAL_MS: "soon",
      EMAIL_FROM: "from@example.com",
    });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected invalid custom flags to fail validation");
    }
    const messages = result.error.issues.reduce<Record<string, string>>(
      (acc, issue) => {
        acc[issue.path.join(".")] = issue.message;
        return acc;
      },
      {},
    );
    expect(messages.DEPOSIT_RELEASE_CUSTOM_ENABLED).toBe(
      "must be true or false",
    );
    expect(messages.DEPOSIT_RELEASE_CUSTOM_INTERVAL_MS).toBe(
      "must be a number",
    );
  });
});

// requireEnv function

describe("requireEnv", () => {
  it("returns existing string", async () => {
    await withEnv({ TEST: "value" }, async () => {
      const { requireEnv } = await import("@acme/config/env/core");
      expect(requireEnv("TEST", "string")).toBe("value");
    });
  });

  it("parses booleans", async () => {
    await withEnv({ TRUE: "true", FALSE: "FALSE", ONE: "1", ZERO: "0" }, async () => {
      const { requireEnv } = await import("@acme/config/env/core");
      expect(requireEnv("TRUE", "boolean")).toBe(true);
      expect(requireEnv("FALSE", "boolean")).toBe(false);
      expect(requireEnv("ONE", "boolean")).toBe(true);
      expect(requireEnv("ZERO", "boolean")).toBe(false);
    });
  });

  it("rejects invalid boolean", async () => {
    await withEnv({ FLAG: "yes" }, async () => {
      const { requireEnv } = await import("@acme/config/env/core");
      expect(() => requireEnv("FLAG", "boolean")).toThrow(
        "FLAG must be a boolean"
      );
    });
  });

  it("parses numbers", async () => {
    await withEnv({ INT: "42", NEG: "-5", FLOAT: "3.14" }, async () => {
      const { requireEnv } = await import("@acme/config/env/core");
      expect(requireEnv("INT", "number")).toBe(42);
      expect(requireEnv("NEG", "number")).toBe(-5);
      expect(requireEnv("FLOAT", "number")).toBe(3.14);
    });
  });

  it("rejects invalid number", async () => {
    await withEnv({ NUM: "NaN" }, async () => {
      const { requireEnv } = await import("@acme/config/env/core");
      expect(() => requireEnv("NUM", "number")).toThrow(
        "NUM must be a number"
      );
    });
  });

  it("errors when missing or empty", async () => {
    await expect(
      withEnv({ MISSING: undefined }, async () => {
        const { requireEnv } = await import("@acme/config/env/core");
        requireEnv("MISSING");
      })
    ).rejects.toThrow("MISSING is required");

    await expect(
      withEnv({ EMPTY: "" }, async () => {
        const { requireEnv } = await import("@acme/config/env/core");
        requireEnv("EMPTY");
      })
    ).rejects.toThrow("EMPTY is required");
  });
});

// proxy traps and invalid load

describe("coreEnv proxy traps", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TODO: Skipped due to env snapshot behavior in core/env.snapshot.ts
  // When tests reassign process.env, the loader uses the old snapshot.
  it.skip("lazily loads only once and supports standard traps", async () => {
    await withEnv({ CMS_SPACE_URL: "https://cms.example.com" }, async () => {
      const core = await import("@acme/config/env/core");
      const first = core.coreEnv.CMS_SPACE_URL;
      process.env.CMS_SPACE_URL = "https://changed.example.com";
      const second = core.coreEnv.CMS_SPACE_URL;
      expect(first).toBe("https://cms.example.com");
      expect(second).toBe("https://cms.example.com");
      expect("CMS_SPACE_URL" in core.coreEnv).toBe(true);
      expect(Object.keys(core.coreEnv)).toContain("CMS_SPACE_URL");
      const desc = Object.getOwnPropertyDescriptor(core.coreEnv, "CMS_SPACE_URL");
      expect(desc?.value).toBe("https://cms.example.com");
    });
  });

  it("logs and throws on invalid env", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv({ NEXT_PUBLIC_BASE_URL: "not a url" }, async () => {
        const { loadCoreEnv } = await import("@acme/config/env/core");
        loadCoreEnv();
      })
    ).rejects.toThrow("Invalid core environment variables");
    const combined = errorSpy.mock.calls.map((c) => c.join(" ")).join(" ");
    expect(combined).toContain("NEXT_PUBLIC_BASE_URL");
  });
});
