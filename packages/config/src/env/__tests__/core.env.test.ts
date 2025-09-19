import { afterEach, describe, expect, it } from "@jest/globals";
import { createExpectInvalidAuthEnv } from "../../../test/utils/expectInvalidAuthEnv";
import { coreEnvSchema } from "../core.ts";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";

const ORIGINAL_ENV = process.env;

const withEnv = async <T>(
  env: NodeJS.ProcessEnv,
  fn: () => Promise<T>
): Promise<T> => {
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

const importCore = () => import("../core.ts");

const expectInvalidAuth = createExpectInvalidAuthEnv(withEnv);

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("minimal and happy path", () => {
  it("provides defaults for minimal env", async () => {
    await withEnv(
      {
        CMS_SPACE_URL: undefined,
        CMS_ACCESS_TOKEN: undefined,
        SANITY_API_VERSION: undefined,
        CART_COOKIE_SECRET: undefined,
        NEXTAUTH_SECRET: undefined,
        SESSION_SECRET: undefined,
      },
      async () => {
        const { loadCoreEnv } = await importCore();
        const env = loadCoreEnv();
        expect(env.CMS_SPACE_URL).toBe("https://cms.example.com");
        expect(env.CMS_ACCESS_TOKEN).toBe("placeholder-token");
        expect(env.SANITY_API_VERSION).toBe("2021-10-21");
        expect(env.CART_COOKIE_SECRET).toBe("dev-cart-secret");
      }
    );
  });

  it("parses explicit values", async () => {
    await withEnv(
      {
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "v1",
        CART_COOKIE_SECRET: "secret",
        CART_TTL: "45",
        NEXT_PUBLIC_BASE_URL: "https://shop.example.com",
        OUTPUT_EXPORT: "1",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://redis.example.com",
        UPSTASH_REDIS_REST_TOKEN: "strongtokenstrongtokenstrongtoken!!",
        COOKIE_DOMAIN: "example.com",
      },
      async () => {
        const { loadCoreEnv } = await importCore();
        const env = loadCoreEnv();
        expect(env.CART_TTL).toBe(45);
        expect(env.OUTPUT_EXPORT).toBe(true);
        expect(env.NEXT_PUBLIC_BASE_URL).toBe("https://shop.example.com");
        expect(env.SESSION_STORE).toBe("redis");
        expect(env.UPSTASH_REDIS_REST_URL).toBe("https://redis.example.com");
        expect(env.UPSTASH_REDIS_REST_TOKEN).toBe(
          "strongtokenstrongtokenstrongtoken!!"
        );
        expect(env.COOKIE_DOMAIN).toBe("example.com");
      }
    );
  });
});

describe("requireEnv", () => {
  const getRequire = async () => (await importCore()).requireEnv;

  it("throws on missing or blank values", async () => {
    await withEnv({}, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("MISSING")).toThrow("MISSING is required");
      process.env.MISSING = "";
      expect(() => requireEnv("MISSING")).toThrow("MISSING is required");
    });
  });

  it.each([
    ["true", true],
    ["false", false],
    ["1", true],
    ["0", false],
  ])("parses boolean %s", async (raw, expected) => {
    await withEnv({ BOOL: raw }, async () => {
      const requireEnv = await getRequire();
      expect(requireEnv("BOOL", "boolean")).toBe(expected);
    });
  });

  it("rejects invalid boolean", async () => {
    await withEnv({ BOOL: "no" }, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("BOOL", "boolean")).toThrow(
        "BOOL must be a boolean"
      );
    });
  });

  it("rejects invalid number", async () => {
    await withEnv({ NUM: "abc" }, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("NUM", "number")).toThrow("NUM must be a number");
    });
  });

  it("parses numeric values", async () => {
    await withEnv({ NUM: "42" }, async () => {
      const requireEnv = await getRequire();
      expect(requireEnv("NUM", "number")).toBe(42);
    });
  });
});

describe("number and url validation", () => {
  it("rejects invalid number", async () => {
    await withEnv({ CART_TTL: "abc" }, async () => {
      const { loadCoreEnv } = await importCore();
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    });
  });

  it("rejects invalid url", async () => {
    await withEnv({ NEXT_PUBLIC_BASE_URL: "not a url" }, async () => {
      const { loadCoreEnv } = await importCore();
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    });
  });
});

describe("depositReleaseEnvRefinement", () => {
  it("reports custom errors for invalid ENABLED and INTERVAL_MS values", async () => {
    await withEnv(
      {
        DEPOSIT_RELEASE_FOO_ENABLED: "maybe",
        DEPOSIT_RELEASE_FOO_INTERVAL_MS: "soon",
      },
      async () => {
        const { loadCoreEnv } = await importCore();
        const err = jest.spyOn(console, "error").mockImplementation(() => {});
        expect(() => loadCoreEnv()).toThrow(
          "Invalid core environment variables"
        );
        const output = err.mock.calls.flat().join("\n");
        expect(output).toContain(
          "DEPOSIT_RELEASE_FOO_ENABLED: must be true or false"
        );
        expect(output).toContain(
          "DEPOSIT_RELEASE_FOO_INTERVAL_MS: must be a number"
        );
        err.mockRestore();
      }
    );
  });

  it("validates late fee flags", async () => {
    await withEnv(
      { LATE_FEE_ENABLED: "maybe", LATE_FEE_INTERVAL_MS: "soon" },
      async () => {
        const { loadCoreEnv } = await importCore();
        const err = jest.spyOn(console, "error").mockImplementation(() => {});
        expect(() => loadCoreEnv()).toThrow(
          "Invalid core environment variables"
        );
        const output = err.mock.calls.flat().join("\n");
        expect(output).toContain("LATE_FEE_ENABLED: must be true or false");
        expect(output).toContain("LATE_FEE_INTERVAL_MS: must be a number");
        err.mockRestore();
      }
    );
  });

  it("parses built-in deposit, reverse logistics, and late fee vars", async () => {
    const { coreEnvSchema } = await importCore();
    const result = coreEnvSchema.safeParse({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "false",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "3000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DEPOSIT_RELEASE_ENABLED).toBe(true);
      expect(result.data.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
      expect(result.data.REVERSE_LOGISTICS_ENABLED).toBe(false);
      expect(result.data.REVERSE_LOGISTICS_INTERVAL_MS).toBe(2000);
      expect(result.data.LATE_FEE_ENABLED).toBe(true);
      expect(result.data.LATE_FEE_INTERVAL_MS).toBe(3000);
    }
  });

  it("reports issues for invalid deposit, reverse logistics, and late fee vars", async () => {
    const { coreEnvSchema } = await importCore();
    const result = coreEnvSchema.safeParse({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      DEPOSIT_RELEASE_ENABLED: "maybe",
      DEPOSIT_RELEASE_INTERVAL_MS: "soon",
      REVERSE_LOGISTICS_ENABLED: "nah",
      REVERSE_LOGISTICS_INTERVAL_MS: "later",
      LATE_FEE_ENABLED: "perhaps",
      LATE_FEE_INTERVAL_MS: "whenever",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_ENABLED"],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_INTERVAL_MS"],
            message: "must be a number",
          }),
          expect.objectContaining({
            path: ["REVERSE_LOGISTICS_ENABLED"],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: ["REVERSE_LOGISTICS_INTERVAL_MS"],
            message: "must be a number",
          }),
          expect.objectContaining({
            path: ["LATE_FEE_ENABLED"],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: ["LATE_FEE_INTERVAL_MS"],
            message: "must be a number",
          }),
        ])
      );
    }
  });
});

describe("AUTH_TOKEN_TTL normalization", () => {
  const cleanEnv = {
    SESSION_STORE: undefined,
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
  } as const;

  it("defaults numeric value", async () => {
    await withEnv(cleanEnv, async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv({ AUTH_TOKEN_TTL: 60 } as any);
      expect(env.AUTH_TOKEN_TTL).toBe(900);
    });
  });

  it("normalizes numeric string", async () => {
    await withEnv(cleanEnv, async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv({ AUTH_TOKEN_TTL: "120" } as any);
      expect(env.AUTH_TOKEN_TTL).toBe(120);
    });
  });

  it("normalizes whitespace string", async () => {
    await withEnv(cleanEnv, async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv({ AUTH_TOKEN_TTL: " 60 " } as any);
      expect(env.AUTH_TOKEN_TTL).toBe(60);
    });
  });

  it("parses string with unit", async () => {
    await withEnv(cleanEnv, async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv({ AUTH_TOKEN_TTL: "2m" } as any);
      expect(env.AUTH_TOKEN_TTL).toBe(120);
    });
  });

  it("defaults blank string", async () => {
    await withEnv(cleanEnv, async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv({ AUTH_TOKEN_TTL: "   " } as any);
      expect(env.AUTH_TOKEN_TTL).toBe(900);
    });
  });
});

describe("redis hints", () => {
  it("accepts full redis config", async () => {
    await withEnv(
      {
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://redis.example.com",
        UPSTASH_REDIS_REST_TOKEN: "strongtokenstrongtokenstrongtoken!!",
      },
      async () => {
        const { loadCoreEnv } = await importCore();
        const env = loadCoreEnv();
        expect(env.SESSION_STORE).toBe("redis");
        expect(env.UPSTASH_REDIS_REST_URL).toBe("https://redis.example.com");
        expect(env.UPSTASH_REDIS_REST_TOKEN).toBe(
          "strongtokenstrongtokenstrongtoken!!"
        );
      }
    );
  });

  it("rejects partial redis config", async () => {
    await expectInvalidAuth({
      env: {
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://redis.example.com",
        UPSTASH_REDIS_REST_TOKEN: undefined,
      },
      accessor: (auth) => auth.loadAuthEnv(),
    });
  });

  it("defaults to memory when redis vars missing", async () => {
    await withEnv(
      {
        SESSION_STORE: undefined,
        UPSTASH_REDIS_REST_URL: undefined,
        UPSTASH_REDIS_REST_TOKEN: undefined,
      },
      async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv();
      expect(env.SESSION_STORE).toBeUndefined();
      expect(env.UPSTASH_REDIS_REST_URL).toBeUndefined();
      }
    );
  });
});

describe("COOKIE_DOMAIN", () => {
  it("includes domain when set", async () => {
    await withEnv({ COOKIE_DOMAIN: "shop.example.com" }, async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv();
      expect(env.COOKIE_DOMAIN).toBe("shop.example.com");
    });
  });

  it("omits domain when unset", async () => {
    await withEnv({}, async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv();
      expect(env.COOKIE_DOMAIN).toBeUndefined();
    });
  });
});

describe("coreEnv caching", () => {
  it("caches the parsed environment", async () => {
    await withEnv({ CMS_SPACE_URL: "https://first.example.com" }, async () => {
      const mod = await importCore();
      expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://first.example.com");
      process.env.CMS_SPACE_URL = "https://second.example.com";
      expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://first.example.com");
    });
  });

  it("calls loadCoreEnv only once for multiple accesses", async () => {
    await withEnv({ CMS_SPACE_URL: "https://example.com" }, async () => {
      const mod = await importCore();
      const spy = jest.spyOn(mod.coreEnvSchema, "safeParse");
      mod.coreEnv.NODE_ENV;
      mod.coreEnv.NODE_ENV;
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });
});

describe("NODE_ENV branches", () => {
  it("defaults CART_COOKIE_SECRET in test", async () => {
    await withEnv(
      { NODE_ENV: "test", CART_COOKIE_SECRET: undefined },
      async () => {
        const { loadCoreEnv } = await importCore();
        const env = loadCoreEnv();
        expect(env.CART_COOKIE_SECRET).toBe("dev-cart-secret");
      }
    );
  });

  it("requires CART_COOKIE_SECRET in production", async () => {
    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          CMS_SPACE_URL: "https://example.com",
          CMS_ACCESS_TOKEN: "token",
          SANITY_API_VERSION: "v1",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: SESSION_SECRET,
          CART_COOKIE_SECRET: undefined,
        },
        () => importCore()
      )
    ).rejects.toThrow("Invalid core environment variables");
  });

  it("accepts CART_COOKIE_SECRET in production", async () => {
    await withEnv(
      {
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "v1",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET: SESSION_SECRET,
        CART_COOKIE_SECRET: "secret",
      },
      async () => {
        const { loadCoreEnv } = await importCore();
        const env = loadCoreEnv();
        expect(env.CART_COOKIE_SECRET).toBe("secret");
      }
    );
  });
});

describe("coreEnv extras", () => {
  it("requires SENDGRID_API_KEY when EMAIL_PROVIDER is sendgrid", () => {
    const result = coreEnvSchema.safeParse({ EMAIL_PROVIDER: "sendgrid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("SENDGRID_API_KEY");
    }
  });

  it("propagates email schema errors", async () => {
    await expect(
      withEnv(
        { EMAIL_PROVIDER: "sendgrid", EMAIL_FROM: "from@example.com" },
        () => importCore(),
      )
    ).rejects.toThrow("Invalid email environment variables");
  });

  it("propagates auth schema errors", async () => {
    await expectInvalidAuth({
      env: { AUTH_PROVIDER: "jwt", JWT_SECRET: undefined },
      accessor: (auth) => auth.loadAuthEnv(),
    });
  });

  it("propagates payments schema errors", async () => {
    await expect(
      withEnv({ PAYMENTS_PROVIDER: "stripe" }, () => importCore())
    ).rejects.toThrow("Invalid payments environment variables");
  });

  it("reloads after jest.resetModules", async () => {
    await withEnv({ CMS_SPACE_URL: "https://first.example.com" }, async () => {
      const mod1 = await importCore();
      expect(mod1.coreEnv.CMS_SPACE_URL).toBe("https://first.example.com");
    });

    await withEnv({ CMS_SPACE_URL: "https://second.example.com" }, async () => {
      const mod2 = await importCore();
      expect(mod2.coreEnv.CMS_SPACE_URL).toBe("https://second.example.com");
    });
  });
});

describe("coreEnv proxy traps", () => {
  it("supports reflection helpers", async () => {
    await withEnv(
      {
        NODE_ENV: "development",
        CMS_SPACE_URL: undefined,
        CMS_ACCESS_TOKEN: undefined,
        SANITY_API_VERSION: undefined,
        CART_COOKIE_SECRET: undefined,
        NEXTAUTH_SECRET: undefined,
        SESSION_SECRET: undefined,
      },
      async () => {
        const { coreEnv } = await importCore();
        expect("NODE_ENV" in coreEnv).toBe(true);
        expect("MISSING" in coreEnv).toBe(false);
        const keys = Object.keys(coreEnv);
        expect(keys).toContain("NODE_ENV");
        expect(keys).not.toContain("MISSING");
        const desc = Object.getOwnPropertyDescriptor(coreEnv, "NODE_ENV");
        expect(desc?.value).toBe("development");
      }
    );
  });
});

describe("production fail fast", () => {
  it("evaluates coreEnv.NODE_ENV eagerly", async () => {
    const base = {
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      CART_COOKIE_SECRET: "secret",
    } as const;
    await withEnv(base, async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { coreEnv } = await importCore();
      expect(coreEnv.NODE_ENV).toBe("production");
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});

describe("AUTH_TOKEN_TTL normalization", () => {
  const base = {
    NODE_ENV: "production",
    CMS_SPACE_URL: "https://example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
    CART_COOKIE_SECRET: "secret",
  } as const;

  it.each([
    ["60", 60],
    ["2 m", 120],
  ])("normalizes %s", async (ttl, expected) => {
    await withEnv({ ...base, AUTH_TOKEN_TTL: ttl }, async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv();
      expect(env.AUTH_TOKEN_TTL).toBe(expected);
    });
  });
});

describe("SESSION_STORE cross-field validation", () => {
  const base = {
    NODE_ENV: "production",
    CMS_SPACE_URL: "https://example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
  } as const;

  it("requires Upstash credentials when SESSION_STORE=redis", async () => {
    await expectInvalidAuth({
      env: {
        ...base,
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: undefined,
        UPSTASH_REDIS_REST_TOKEN: undefined,
      },
      accessor: (auth) => auth.loadAuthEnv(),
    });
  });
});

describe("loadCoreEnv logging", () => {
  it("logs each invalid path before throwing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await withEnv(
      {
        SESSION_STORE: undefined,
        UPSTASH_REDIS_REST_URL: undefined,
        UPSTASH_REDIS_REST_TOKEN: undefined,
      },
      async () => {
      const { loadCoreEnv } = await importCore();
      expect(() =>
        loadCoreEnv({
          CMS_SPACE_URL: "https://example.com",
          CMS_ACCESS_TOKEN: "token",
          SANITY_API_VERSION: "v1",
          EMAIL_PROVIDER: "sendgrid",
          SESSION_STORE: "redis",
        } as unknown as NodeJS.ProcessEnv)
      ).toThrow("Invalid core environment variables");
      }
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("SENDGRID_API_KEY")
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("UPSTASH_REDIS_REST_URL")
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("UPSTASH_REDIS_REST_TOKEN")
    );
    errorSpy.mockRestore();
  });
});
