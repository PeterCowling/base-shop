import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { withEnv } from "../../../config/test/utils/withEnv";

describe("deposit-release validation", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports invalid boolean and number", async () => {
    await withEnv(
      {
        DEPOSIT_RELEASE_ENABLED: "maybe",
        DEPOSIT_RELEASE_INTERVAL_MS: "abc",
      },
      async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        const { loadCoreEnv } = await import("@acme/config/src/env/core.ts");
        expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
        const calls = spy.mock.calls.map((c) => c[0]);
        expect(calls).toEqual(
          expect.arrayContaining([
            expect.stringContaining("DEPOSIT_RELEASE_ENABLED: must be true or false"),
            expect.stringContaining("DEPOSIT_RELEASE_INTERVAL_MS: must be a number"),
          ]),
        );
        spy.mockRestore();
      },
    );
  });

  it("parses valid values", async () => {
    await withEnv(
      {
        DEPOSIT_RELEASE_ENABLED: "true",
        DEPOSIT_RELEASE_INTERVAL_MS: "5000",
      },
      async () => {
        const { loadCoreEnv } = await import("@acme/config/src/env/core.ts");
        const env = loadCoreEnv();
        expect(env.DEPOSIT_RELEASE_ENABLED).toBe(true);
        expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(5000);
      },
    );
  });
});

describe("requireEnv helper", () => {
  const getRequire = async () => (await import("@acme/config/src/env/core.ts")).requireEnv;

  it("parses booleans", async () => {
    await withEnv({ TEST_BOOL: "TrUe" }, async () => {
      const requireEnv = await getRequire();
      expect(requireEnv("TEST_BOOL", "boolean")).toBe(true);
    });
    await withEnv({ TEST_BOOL: "0" }, async () => {
      const requireEnv = await getRequire();
      expect(requireEnv("TEST_BOOL", "boolean")).toBe(false);
    });
  });

  it("parses numbers", async () => {
    await withEnv({ TEST_NUM: "42" }, async () => {
      const requireEnv = await getRequire();
      expect(requireEnv("TEST_NUM", "number")).toBe(42);
    });
  });

  it("throws for invalid boolean", async () => {
    await withEnv({ TEST_BOOL: "maybe" }, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("TEST_BOOL", "boolean")).toThrow(
        "TEST_BOOL must be a boolean",
      );
    });
  });

  it("throws for invalid number", async () => {
    await withEnv({ TEST_NUM: "abc" }, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("TEST_NUM", "number")).toThrow(
        "TEST_NUM must be a number",
      );
    });
  });

  it("throws for missing key", async () => {
    await withEnv({}, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("MISSING", "boolean")).toThrow("MISSING is required");
    });
  });
});

describe("AUTH_TOKEN_TTL normalisation", () => {
  it("trims whitespace and normalises units", async () => {
    await withEnv({ NODE_ENV: "development", AUTH_TOKEN_TTL: " 5 m " }, async () => {
      const { loadCoreEnv } = await import("@acme/config/src/env/core.ts");
      const env = loadCoreEnv();
      expect(env.AUTH_TOKEN_TTL).toBe(300);
    });
  });
});

describe("NEXT_PUBLIC_BASE_URL validation", () => {
  it("rejects invalid url", async () => {
    await withEnv({ NEXT_PUBLIC_BASE_URL: "not a url" }, async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { loadCoreEnv } = await import("@acme/config/src/env/core.ts");
      expect(() => loadCoreEnv()).toThrow(
        "Invalid core environment variables",
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  it("accepts valid url", async () => {
    await withEnv({ NEXT_PUBLIC_BASE_URL: "https://example.com" }, async () => {
      const { loadCoreEnv } = await import("@acme/config/src/env/core.ts");
      const env = loadCoreEnv();
      expect(env.NEXT_PUBLIC_BASE_URL).toBe("https://example.com");
    });
  });
});

