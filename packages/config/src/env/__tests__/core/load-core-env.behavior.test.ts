/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  coreEnvSchema,
  loadCoreEnv,
} from "../../core.ts";
import { NEXT_SECRET, SESSION_SECRET } from "../authEnvTestUtils.ts";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
  EMAIL_FROM: "from@example.com",
};

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("loadCoreEnv", () => {
  it("throws and logs issues for malformed env", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "fast",
      } as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });

  it("logs each issue and throws for missing required secrets", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    process.env.NODE_ENV = "production";
    const { loadCoreEnv: freshLoad } = await import("../../core.ts");
    expect(() => freshLoad({} as NodeJS.ProcessEnv)).toThrow(
      "Invalid core environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXTAUTH_SECRET"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("SESSION_SECRET"),
    );
    errorSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });
});

describe("loadCoreEnv", () => {
  const ORIGINAL = process.env;
  afterEach(() => {
    process.env = ORIGINAL;
  });

  it("logs and throws when required env vars are invalid", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        CMS_SPACE_URL: "not-a-url",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    errorSpy.mockRestore();
  });

  it("returns parsed env on success without logging", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const env = loadCoreEnv({
      ...baseEnv,
      NODE_ENV: "development",
    } as unknown as NodeJS.ProcessEnv);
    expect(env).toMatchObject({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      CART_COOKIE_SECRET: "dev-cart-secret",
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("coerces optional export, phase, luxury and stock alert vars", () => {
    const env = loadCoreEnv({
      ...baseEnv,
      OUTPUT_EXPORT: "true",
      NEXT_PUBLIC_PHASE: "beta",
      LUXURY_FEATURES_RA_TICKETING: "",
      LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: "5",
      LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH: "true",
      LUXURY_FEATURES_TRACKING_DASHBOARD: "",
      LUXURY_FEATURES_RETURNS: "true",
      STOCK_ALERT_RECIPIENTS: "a@a.com,b@b.com",
      STOCK_ALERT_WEBHOOK: "https://example.com/hook",
      STOCK_ALERT_DEFAULT_THRESHOLD: "10",
      STOCK_ALERT_RECIPIENT: "alert@example.com",
    } as unknown as NodeJS.ProcessEnv);
    expect(env).toMatchObject({
      OUTPUT_EXPORT: true,
      NEXT_PUBLIC_PHASE: "beta",
      LUXURY_FEATURES_RA_TICKETING: false,
      LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: 5,
      LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH: true,
      LUXURY_FEATURES_TRACKING_DASHBOARD: false,
      LUXURY_FEATURES_RETURNS: true,
      STOCK_ALERT_RECIPIENTS: "a@a.com,b@b.com",
      STOCK_ALERT_WEBHOOK: "https://example.com/hook",
      STOCK_ALERT_DEFAULT_THRESHOLD: 10,
      STOCK_ALERT_RECIPIENT: "alert@example.com",
    });
  });

  it("logs issues and throws for invalid optional vars", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        NEXT_PUBLIC_PHASE: 123 as unknown as string,
        LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: "abc",
        STOCK_ALERT_RECIPIENTS: 456 as unknown as string,
        STOCK_ALERT_WEBHOOK: "not-a-url",
        STOCK_ALERT_DEFAULT_THRESHOLD: "oops",
        STOCK_ALERT_RECIPIENT: "not-an-email",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_PHASE"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_RECIPIENTS"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_WEBHOOK"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_DEFAULT_THRESHOLD"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_RECIPIENT"),
    );
    errorSpy.mockRestore();
  });

  it("parses valid deposit, reverse logistics and late fee vars", () => {
    const env = loadCoreEnv({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "false",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "3000",
    } as unknown as NodeJS.ProcessEnv);
    expect(env).toMatchObject({
      DEPOSIT_RELEASE_ENABLED: true,
      DEPOSIT_RELEASE_INTERVAL_MS: 1000,
      REVERSE_LOGISTICS_ENABLED: false,
      REVERSE_LOGISTICS_INTERVAL_MS: 2000,
      LATE_FEE_ENABLED: true,
      LATE_FEE_INTERVAL_MS: 3000,
    });
  });

  it("logs issues and throws for invalid deposit/reverse/late fee vars", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "yes",
        REVERSE_LOGISTICS_ENABLED: "maybe",
        LATE_FEE_INTERVAL_MS: "soon",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • REVERSE_LOGISTICS_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • LATE_FEE_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });

  it("logs all issues for mixed invalid variables", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        CMS_SPACE_URL: "not-a-url",
        DEPOSIT_RELEASE_ENABLED: "nope",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("CMS_SPACE_URL"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    errorSpy.mockRestore();
  });

  it("throws when required variables are invalid", () => {
    process.env = {
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "",
      SANITY_API_VERSION: "v1",
    } as unknown as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => loadCoreEnv(process.env)).toThrow(
      "Invalid core environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("CMS_SPACE_URL"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("CMS_ACCESS_TOKEN"),
    );
    errorSpy.mockRestore();
  });
});

describe("loadCoreEnv logging", () => {
  it("logs errors for malformed deposit env vars", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "yes",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • REVERSE_LOGISTICS_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });
});

describe("loadCoreEnv required variable validation", () => {
  const snapshot = process.env;
  const base = {
    CMS_SPACE_URL: "https://example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    SANITY_PROJECT_ID: "dummy-project-id",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "dummy-api-token",
    SANITY_PREVIEW_SECRET: "dummy-preview-secret",
    NODE_ENV: "production",
    CART_COOKIE_SECRET: "secret",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
    EMAIL_FROM: "test@example.com",
    EMAIL_PROVIDER: "smtp",
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = snapshot;
  });

  describe("CMS_SPACE_URL", () => {
    it.each([
      ["present", "https://example.com", true],
      ["missing", undefined, false],
      ["empty", "", false],
      ["whitespace", "   ", false],
      ["invalid", "not-a-url", false],
    ])("%s", async (_label, value, ok) => {
      jest.resetModules();
      Object.assign(process.env, base);
      const { loadCoreEnv } = await import("../../core.ts");
      const env = { ...base } as NodeJS.ProcessEnv;
      if (value === undefined) delete env.CMS_SPACE_URL;
      else env.CMS_SPACE_URL = value;
      const run = () => loadCoreEnv(env);
      ok
        ? expect(run).not.toThrow()
        : expect(run).toThrow("Invalid core environment variables");
    });
  });

  describe("CART_COOKIE_SECRET", () => {
    it.each([
      ["present", "secret", true],
      ["missing", undefined, false],
      ["empty", "", false],
      ["whitespace", "   ", true],
    ])("%s", async (_label, value, ok) => {
      jest.resetModules();
      Object.assign(process.env, base);
      const { loadCoreEnv } = await import("../../core.ts");
      const env = {
        ...base,
        CMS_SPACE_URL: "https://example.com",
      } as NodeJS.ProcessEnv;
      if (value === undefined) delete env.CART_COOKIE_SECRET;
      else env.CART_COOKIE_SECRET = value;
      const run = () => loadCoreEnv(env);
      ok
        ? expect(run).not.toThrow()
        : expect(run).toThrow("Invalid core environment variables");
    });
  });
});

describe("loadCoreEnv boolean parsing", () => {
  const base = {
    ...baseEnv,
    CART_COOKIE_SECRET: "secret",
    NODE_ENV: "test",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  describe("OUTPUT_EXPORT", () => {
    it.each([
      ["true", true],
      ["false", true],
      ["1", true],
      ["0", true],
      ["yes", true],
      ["no", true],
      [" TRUE ", true],
      [" False ", true],
      [" 1 ", true],
      ["0 ", true],
      [" Yes ", true],
      [" no ", true],
    ])("parses %s", async (input, expected) => {
      process.env = { ...base, OUTPUT_EXPORT: input };
      const { loadCoreEnv } = await import("../../core.ts");
      const env = loadCoreEnv();
      expect(env.OUTPUT_EXPORT).toBe(expected);
    });
  });

  describe("DEPOSIT_RELEASE_ENABLED", () => {
    it.each([
      ["true", true],
      ["false", false],
    ])("accepts %s", async (input, expected) => {
      process.env = { ...base, DEPOSIT_RELEASE_ENABLED: input };
      const { loadCoreEnv } = await import("../../core.ts");
      const env = loadCoreEnv();
      expect(env.DEPOSIT_RELEASE_ENABLED).toBe(expected);
    });

    it.each(["1", "0", "yes", "no", " TRUE ", " false "]) (
      "rejects %s",
      async (input) => {
        process.env = { ...base, DEPOSIT_RELEASE_ENABLED: input };
        const { loadCoreEnv } = await import("../../core.ts");
        expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
      },
    );
  });
});

describe("loadCoreEnv number parsing", () => {
  const base = {
    ...baseEnv,
    CART_COOKIE_SECRET: "secret",
    NODE_ENV: "test",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  describe("CART_TTL", () => {
    it.each([
      ["123", 123],
      ["1.5", 1.5],
      ["-2", -2],
      ["0", 0],
    ])("parses %s", async (input, expected) => {
      process.env = { ...base, CART_TTL: input };
      const { loadCoreEnv } = await import("../../core.ts");
      const env = loadCoreEnv();
      expect(env.CART_TTL).toBe(expected);
    });

    it("defaults when missing", async () => {
      process.env = { ...base };
      const { loadCoreEnv } = await import("../../core.ts");
      const env = loadCoreEnv();
      expect(env.CART_TTL).toBeUndefined();
    });

    it.each(["abc", "NaN"])("rejects %s", async (input) => {
      process.env = { ...base, CART_TTL: input };
      const { loadCoreEnv } = await import("../../core.ts");
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    });
  });

  describe("DEPOSIT_RELEASE_INTERVAL_MS", () => {
    it.each([
      ["1000", 1000],
      ["1.5", 1.5],
      ["-5", -5],
      ["0", 0],
    ])("parses %s", async (input, expected) => {
      process.env = { ...base, DEPOSIT_RELEASE_INTERVAL_MS: input };
      const { loadCoreEnv } = await import("../../core.ts");
      const env = loadCoreEnv();
      expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(expected);
    });

    it("defaults when missing", async () => {
      process.env = { ...base };
      const { loadCoreEnv } = await import("../../core.ts");
      const env = loadCoreEnv();
      expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBeUndefined();
    });

    it.each(["abc", "NaN"])("rejects %s", async (input) => {
      process.env = { ...base, DEPOSIT_RELEASE_INTERVAL_MS: input };
      const { loadCoreEnv } = await import("../../core.ts");
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    });
  });
});

describe("NODE_ENV branches", () => {
  const base = {
    CMS_SPACE_URL: "https://example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    SANITY_PROJECT_ID: "dummy-project-id",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "dummy-api-token",
    SANITY_PREVIEW_SECRET: "dummy-preview-secret",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
    EMAIL_FROM: "test@example.com",
    EMAIL_PROVIDER: "smtp",
  };

  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  it.each(["development", "test"]) (
    "defaults CART_COOKIE_SECRET in %s",
    async (env) => {
      process.env = { ...base, NODE_ENV: env } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { loadCoreEnv } = await import("../../core.ts");
      const parsed = loadCoreEnv();
      expect(parsed.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    },
  );

  it("requires CART_COOKIE_SECRET in production", async () => {
    process.env = {
      ...base,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { loadCoreEnv } = await import("../../core.ts");
    const env = { ...base, NODE_ENV: "production" } as NodeJS.ProcessEnv;
    delete env.CART_COOKIE_SECRET;
    expect(() => loadCoreEnv(env)).toThrow(
      "Invalid core environment variables",
    );
  });

  it("fails fast on invalid env in production", async () => {
    process.env = { ...base, NODE_ENV: "production" } as NodeJS.ProcessEnv;
    jest.resetModules();
    await expect(import("../../core.ts")).rejects.toThrow(
      "Invalid core environment variables",
    );
  });
});

describe("loadCoreEnv fallback precedence", () => {
  const base = {
    CMS_SPACE_URL: "https://cms.example.com",
    SANITY_API_VERSION: "v1",
  };

  it("prefers process.env over .env defaults over code defaults", () => {
    const dotenvDefaults = { CMS_ACCESS_TOKEN: "from-dotenv" };
    const explicit = { CMS_ACCESS_TOKEN: "from-process" };

    const withCodeDefault = loadCoreEnv({ ...base } as NodeJS.ProcessEnv);
    expect(withCodeDefault.CMS_ACCESS_TOKEN).toBe("placeholder-token");

    const withDotenv = loadCoreEnv({
      ...dotenvDefaults,
      ...base,
    } as NodeJS.ProcessEnv);
    expect(withDotenv.CMS_ACCESS_TOKEN).toBe("from-dotenv");

    const withProcess = loadCoreEnv({
      ...dotenvDefaults,
      ...explicit,
      ...base,
    } as NodeJS.ProcessEnv);
    expect(withProcess.CMS_ACCESS_TOKEN).toBe("from-process");
  });
});
