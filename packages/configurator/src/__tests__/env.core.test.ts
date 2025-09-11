import { afterEach, describe, expect, it, jest } from "@jest/globals";

const ORIGINAL_ENV = { ...process.env, EMAIL_FROM: "from@example.com" };

const withEnv = async <T>(env: NodeJS.ProcessEnv, fn: () => Promise<T>): Promise<T> => {
  process.env = { ...ORIGINAL_ENV, ...env } as NodeJS.ProcessEnv;
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete (process.env as any)[key];
  }
  jest.resetModules();
  try {
    return await fn();
  } finally {
    process.env = ORIGINAL_ENV;
  }
};

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("deposit-release validation", () => {
  it("reports invalid boolean and number", async () => {
    await withEnv(
      {
        DEPOSIT_RELEASE_ENABLED: "maybe",
        DEPOSIT_RELEASE_INTERVAL_MS: "abc",
      },
      async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        const { loadCoreEnv } = await import("@acme/config/env/core");
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
        const { loadCoreEnv } = await import("@acme/config/env/core");
        const env = loadCoreEnv();
        expect(env.DEPOSIT_RELEASE_ENABLED).toBe(true);
        expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(5000);
      },
    );
  });
});

describe("reverse logistics and late fee validation", () => {
  it("reports invalid boolean and number", async () => {
    await withEnv(
      {
        REVERSE_LOGISTICS_ENABLED: "maybe",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
        LATE_FEE_ENABLED: "nah",
        LATE_FEE_INTERVAL_MS: "soon",
      },
      async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        const { loadCoreEnv } = await import("@acme/config/env/core");
        expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
        const calls = spy.mock.calls.map((c) => c[0]);
        expect(calls).toEqual(
          expect.arrayContaining([
            expect.stringContaining(
              "REVERSE_LOGISTICS_ENABLED: must be true or false",
            ),
            expect.stringContaining(
              "REVERSE_LOGISTICS_INTERVAL_MS: must be a number",
            ),
            expect.stringContaining(
              "LATE_FEE_ENABLED: must be true or false",
            ),
            expect.stringContaining(
              "LATE_FEE_INTERVAL_MS: must be a number",
            ),
          ]),
        );
        spy.mockRestore();
      },
    );
  });

  it("parses valid values", async () => {
    await withEnv(
      {
        REVERSE_LOGISTICS_ENABLED: "true",
        REVERSE_LOGISTICS_INTERVAL_MS: "1000",
        LATE_FEE_ENABLED: "false",
        LATE_FEE_INTERVAL_MS: "4000",
      },
      async () => {
        const { loadCoreEnv } = await import("@acme/config/env/core");
        const env = loadCoreEnv();
        expect(env.REVERSE_LOGISTICS_ENABLED).toBe(true);
        expect(env.REVERSE_LOGISTICS_INTERVAL_MS).toBe(1000);
        expect(env.LATE_FEE_ENABLED).toBe(false);
        expect(env.LATE_FEE_INTERVAL_MS).toBe(4000);
      },
    );
  });
});

describe("requireEnv helper", () => {
  const getRequire = async () => (await import("@acme/config/env/core")).requireEnv;

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

  it("throws for invalid boolean", async () => {
    await withEnv({ TEST_BOOL: "maybe" }, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("TEST_BOOL", "boolean")).toThrow(
        "TEST_BOOL must be a boolean",
      );
    });
  });

  it("throws for missing key", async () => {
    await withEnv({}, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("MISSING", "boolean")).toThrow("MISSING is required");
    });
  });

  it("parses numbers", async () => {
    await withEnv({ TEST_NUM: "42" }, async () => {
      const requireEnv = await getRequire();
      expect(requireEnv("TEST_NUM", "number")).toBe(42);
    });
  });

  it("throws for invalid number", async () => {
    await withEnv({ TEST_NUM: "forty-two" }, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("TEST_NUM", "number")).toThrow(
        "TEST_NUM must be a number",
      );
    });
  });
});


describe("coreEnv lazy loading", () => {
  it("loads core env only once despite repeated property reads", async () => {
    await withEnv(
      {
        DEPOSIT_RELEASE_ENABLED: "true",
        DEPOSIT_RELEASE_INTERVAL_MS: "5000",
        NEXT_PUBLIC_BASE_URL: "https://example.com",
      },
      async () => {
        const mod = await import("@acme/config/env/core");
        // First access triggers the actual load
        expect(mod.coreEnv.DEPOSIT_RELEASE_ENABLED).toBe(true);
        const spy = jest.spyOn(mod, "loadCoreEnv");
        // Subsequent property reads should use the cached env
        expect(mod.coreEnv.DEPOSIT_RELEASE_INTERVAL_MS).toBe(5000);
        expect(mod.coreEnv.NEXT_PUBLIC_BASE_URL).toBe("https://example.com");
        expect(mod.coreEnv.NEXT_PUBLIC_BASE_URL).toBe("https://example.com");
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
      },
    );
  });
});

describe("NEXT_PUBLIC_BASE_URL validation", () => {
  it("rejects invalid url", async () => {
    await withEnv({ NEXT_PUBLIC_BASE_URL: "not a url" }, async () => {
      const { loadCoreEnv } = await import("@acme/config/env/core");
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    });
  });

  it("accepts valid url", async () => {
    await withEnv({ NEXT_PUBLIC_BASE_URL: "https://example.com" }, async () => {
      const { loadCoreEnv } = await import("@acme/config/env/core");
      const env = loadCoreEnv();
      expect(env.NEXT_PUBLIC_BASE_URL).toBe("https://example.com");
    });
  });
});
