import { describe, expect, it, jest } from "@jest/globals";
import { z } from "zod";
import { withEnv } from "./helpers/env";

process.env.EMAIL_FROM = "from@example.com";
process.env.CMS_SPACE_URL = "https://example.com";
process.env.CMS_ACCESS_TOKEN = "token";
process.env.SANITY_API_VERSION = "v1";
process.env.SANITY_PROJECT_ID = "project";
process.env.SANITY_DATASET = "production";
process.env.SANITY_API_TOKEN = "token";
process.env.SANITY_PREVIEW_SECRET = "secret";
const { loadCoreEnv, depositReleaseEnvRefinement } = require(
  "@acme/config/env/core"
);

const requireEnvImport = async () => (await import("@acme/config/env/core")).requireEnv;

describe("requireEnv", () => {
  it("parses boolean, number, and string", async () => {
    await withEnv(
      { BOOL: "TRUE", NUM: "0", STR: "-12.5" },
      async () => {
        const requireEnv = await requireEnvImport();
        expect(requireEnv("BOOL", "boolean")).toBe(true);
        expect(requireEnv("NUM", "number")).toBe(0);
        expect(requireEnv("STR", "string")).toBe("-12.5");
      },
    );
  });

  it("throws when variable is missing", async () => {
    await withEnv({}, async () => {
      const requireEnv = await requireEnvImport();
      expect(() => requireEnv("MISSING")).toThrow("MISSING is required");
    });
  });

  it("throws on boolean coercion failure", async () => {
    await withEnv({ FLAG: "maybe" }, async () => {
      const requireEnv = await requireEnvImport();
      expect(() => requireEnv("FLAG", "boolean")).toThrow(
        "FLAG must be a boolean",
      );
    });
  });

  it.each(["NaN", "abc"])(
    "throws on number parsing errors for %s",
    async (val) => {
      await withEnv({ NUM: val }, async () => {
        const requireEnv = await requireEnvImport();
        expect(() => requireEnv("NUM", "number")).toThrow(
          "NUM must be a number",
        );
      });
    },
  );
});

describe("deposit/reverse/late-fee refinement", () => {
  it("coerces valid values", () => {
    const env = loadCoreEnv({
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "true",
      REVERSE_LOGISTICS_INTERVAL_MS: "1000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "250",
      EMAIL_FROM: "from@example.com",
    } as any);
    expect(env.DEPOSIT_RELEASE_ENABLED).toBe(true);
    expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
    expect(env.REVERSE_LOGISTICS_ENABLED).toBe(true);
    expect(env.REVERSE_LOGISTICS_INTERVAL_MS).toBe(1000);
    expect(env.LATE_FEE_ENABLED).toBe(true);
    expect(env.LATE_FEE_INTERVAL_MS).toBe(250);
  });

  it("reports invalid booleans and numbers", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        DEPOSIT_RELEASE_ENABLED: "maybe",
        DEPOSIT_RELEASE_INTERVAL_MS: "soon",
        REVERSE_LOGISTICS_ENABLED: "nope",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
        LATE_FEE_ENABLED: "perhaps",
        LATE_FEE_INTERVAL_MS: "eventually",
        EMAIL_FROM: "from@example.com",
      } as any),
    ).toThrow("Invalid core environment variables");
    const output = err.mock.calls.flat().join("\n");
    expect(output).toContain("DEPOSIT_RELEASE_ENABLED: must be true or false");
    expect(output).toContain(
      "DEPOSIT_RELEASE_INTERVAL_MS: must be a number",
    );
    expect(output).toContain(
      "REVERSE_LOGISTICS_ENABLED: must be true or false",
    );
    expect(output).toContain(
      "REVERSE_LOGISTICS_INTERVAL_MS: must be a number",
    );
    expect(output).toContain("LATE_FEE_ENABLED: must be true or false");
    expect(output).toContain("LATE_FEE_INTERVAL_MS: must be a number");
    err.mockRestore();
  });
});

describe("depositReleaseEnvRefinement", () => {
  it("adds issues for bad ENABLED and INTERVAL_MS values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_BAD_ENABLED: "nope",
        DEPOSIT_RELEASE_BAD_INTERVAL_MS: "soon",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_BAD_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_BAD_INTERVAL_MS"],
      message: "must be a number",
    });
  });
});

describe("AUTH_TOKEN_TTL normalization", () => {
  it.each([
    [600, 900],
    ["120", 120],
    ["2m", 120],
    ["", 900],
  ])("normalizes %p", async (input, expected) => {
    await withEnv({ AUTH_TOKEN_TTL: input as any }, async () => {
      const env = loadCoreEnv(process.env);
      expect(env.AUTH_TOKEN_TTL).toBe(expected);
    });
  });
});

describe("invalid URL", () => {
  it("fails when NEXT_PUBLIC_BASE_URL is invalid", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        NEXT_PUBLIC_BASE_URL: "not a url",
        EMAIL_FROM: "from@example.com",
      } as any),
    ).toThrow("Invalid core environment variables");
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});


describe("nested schema errors", () => {
  it("bubbles up auth and email issues", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        AUTH_PROVIDER: "jwt",
        EMAIL_PROVIDER: "sendgrid",
        EMAIL_FROM: "from@example.com",
      } as any),
    ).toThrow("Invalid core environment variables");
    const output = err.mock.calls.flat().join("\n");
    expect(output).toContain("JWT_SECRET is required when AUTH_PROVIDER=jwt");
    expect(output).toContain("SENDGRID_API_KEY: Required");
    err.mockRestore();
  });
});

describe("coreEnv proxy traps", () => {
  it("proxies property access and reflection", async () => {
    await withEnv(
      { CMS_SPACE_URL: "https://example.com", CMS_ACCESS_TOKEN: "tok" },
      async () => {
        const { coreEnv } = await import("@acme/config/env/core");
        expect(coreEnv.CMS_SPACE_URL).toBe("https://example.com");
        expect("CMS_SPACE_URL" in coreEnv).toBe(true);
        expect(Object.keys(coreEnv)).toEqual(
          expect.arrayContaining(["CMS_SPACE_URL", "CMS_ACCESS_TOKEN"]),
        );
        const desc = Object.getOwnPropertyDescriptor(
          coreEnv,
          "CMS_SPACE_URL",
        );
        expect(desc?.value).toBe("https://example.com");
      },
    );
  });
});

describe("coreEnv caching", () => {
  it("reuses parsed env until modules reset", async () => {
    await withEnv(
      { CMS_SPACE_URL: "https://one.example", CMS_ACCESS_TOKEN: "a" },
      async () => {
        const mod = await import("@acme/config/env/core");
        expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://one.example");
        expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://one.example");
      },
    );

    await withEnv(
      { CMS_SPACE_URL: "https://two.example", CMS_ACCESS_TOKEN: "b" },
      async () => {
        const mod = await import("@acme/config/env/core");
        expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://two.example");
      },
    );
  });
});

describe("coreEnv NODE_ENV behavior", () => {
  const base = {
    CMS_SPACE_URL: "https://example.com",
    CMS_ACCESS_TOKEN: "token",
    CART_COOKIE_SECRET: "secret",
  } as NodeJS.ProcessEnv;

  it.each(["development", "test"]) (
    "lazy loads in %s",
    async (env) => {
      await withEnv({ ...base, NODE_ENV: env }, async () => {
        const mod = await import("@acme/config/env/core");
        const spy = jest.spyOn(mod, "loadCoreEnv");
        expect(spy).not.toHaveBeenCalled();
        expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
        expect(spy).not.toHaveBeenCalled();
      });
    },
  );

  it("eagerly loads and fails fast in production", async () => {
    await withEnv(
      {
        ...base,
        NODE_ENV: "production",
        CMS_ACCESS_TOKEN: undefined,
        JEST_WORKER_ID: undefined,
      },
      async () => {
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});

        await expect(import("@acme/config/env/core")).rejects.toThrow(
          "Invalid core environment variables",
        );

        errorSpy.mockRestore();
      },
    );
  });

  it("eagerly loads in production", async () => {
    await withEnv(
      { ...base, NODE_ENV: "production", JEST_WORKER_ID: undefined },
      async () => {
        const mod = await import("@acme/config/env/core");
        const spy = jest.spyOn(mod, "loadCoreEnv");
        spy.mockClear();
        expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
        expect(spy).not.toHaveBeenCalled();
      },
    );
  });
});
