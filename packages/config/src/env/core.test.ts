import { describe, expect, it, jest, afterEach } from "@jest/globals";
import { z } from "zod";
import {
  depositReleaseEnvRefinement,
  loadCoreEnv,
  requireEnv,
  coreEnvSchema,
  coreEnv,
} from "./core.js";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
};

describe("depositReleaseEnvRefinement", () => {
  it("adds issues for invalid deposit and reverse logistics vars", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "soon",
        REVERSE_LOGISTICS_ENABLED: "maybe",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_INTERVAL_MS"],
      message: "must be a number",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["REVERSE_LOGISTICS_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["REVERSE_LOGISTICS_INTERVAL_MS"],
      message: "must be a number",
    });
  });
});

describe("loadCoreEnv", () => {
  it("throws and logs issues on invalid env", () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "nope",
        DEPOSIT_RELEASE_INTERVAL_MS: "later",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalled();
    const joined = errorSpy.mock.calls.flat().join("\n");
    expect(joined).toContain(
      "DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    errorSpy.mockRestore();
  });

  it("succeeds when env is valid", () => {
    const parsed = loadCoreEnv({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
    } as unknown as NodeJS.ProcessEnv);
    expect(parsed.DEPOSIT_RELEASE_ENABLED).toBe(true);
    expect(parsed.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
  });
});

describe("requireEnv", () => {
  const ORIGINAL = process.env;
  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it("throws when missing or empty", () => {
    delete process.env.MISSING;
    expect(() => requireEnv("MISSING")).toThrow("MISSING is required");
    process.env.EMPTY = "   ";
    expect(() => requireEnv("EMPTY")).toThrow("EMPTY is required");
  });

  it("returns trimmed strings", () => {
    process.env.NAME = " value ";
    expect(requireEnv("NAME")).toBe("value");
  });

  it.each([
    ["true", true],
    ["1", true],
    ["false", false],
    ["0", false],
  ])("coerces boolean %s", (input, expected) => {
    process.env.FLAG = input as string;
    expect(requireEnv("FLAG", "boolean")).toBe(expected);
  });

  it("throws on invalid boolean", () => {
    process.env.FLAG = "maybe";
    expect(() => requireEnv("FLAG", "boolean")).toThrow(
      "FLAG must be a boolean",
    );
  });

  it("parses numbers and rejects invalid", () => {
    process.env.NUM = "42";
    expect(requireEnv("NUM", "number")).toBe(42);
    process.env.NUM = "not";
    expect(() => requireEnv("NUM", "number")).toThrow(
      "NUM must be a number",
    );
  });
});

describe("AUTH_TOKEN_TTL normalization", () => {
  const load = (ttl: string) =>
    loadCoreEnv({ ...baseEnv, AUTH_TOKEN_TTL: ttl } as any);

  it.each([
    ["10", 10],
    ["10s", 10],
    ["10 m", 600],
  ])("parses %s", (input, expected) => {
    expect(load(input).AUTH_TOKEN_TTL).toBe(expected);
  });

  it("defaults when blank", () => {
    expect(load(" ").AUTH_TOKEN_TTL).toBe(900); // 15m default
  });

  it("records issue for invalid format", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load("oops")).toThrow("Invalid core environment variables");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("coreEnv proxy caching", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("caches parsed env across multiple reads", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("./core.js");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token");
    // Access again to ensure caching
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it("invokes loadCoreEnv only once", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("./core.js");
    const loadSpy = jest
      .spyOn(mod, "loadCoreEnv")
      .mockReturnValue({
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "v1",
      } as any);
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token");
    // Access again to ensure caching
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(loadSpy).toHaveBeenCalledTimes(1);
    loadSpy.mockRestore();
  });
});


