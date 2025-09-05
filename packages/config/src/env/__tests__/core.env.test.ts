import { afterEach, describe, expect, it } from "@jest/globals";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";

const ORIGINAL_ENV = process.env;

const withEnv = async <T>(
  env: NodeJS.ProcessEnv,
  fn: () => Promise<T>,
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
      },
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
        expect(env.UPSTASH_REDIS_REST_URL).toBe(
          "https://redis.example.com",
        );
        expect(env.UPSTASH_REDIS_REST_TOKEN).toBe(
          "strongtokenstrongtokenstrongtoken!!",
        );
        expect(env.COOKIE_DOMAIN).toBe("example.com");
      },
    );
  });
});

describe("boolean parsing", () => {
  const getRequire = async () => (await importCore()).requireEnv;
  it.each([
    ["true", true],
    ["1", true],
    ["TrUe", true],
    ["false", false],
    ["0", false],
  ])("parses %s", async (raw, expected) => {
    await withEnv({ BOOL: raw }, async () => {
      const requireEnv = await getRequire();
      expect(requireEnv("BOOL", "boolean")).toBe(expected);
    });
  });

  it("rejects invalid boolean", async () => {
    await withEnv({ BOOL: "no" }, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("BOOL", "boolean")).toThrow();
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

describe("redis hints", () => {
  it("accepts full redis config", async () => {
    await withEnv(
      {
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://redis.example.com",
        UPSTASH_REDIS_REST_TOKEN:
          "strongtokenstrongtokenstrongtoken!!",
      },
      async () => {
        const { loadCoreEnv } = await importCore();
        const env = loadCoreEnv();
        expect(env.SESSION_STORE).toBe("redis");
        expect(env.UPSTASH_REDIS_REST_URL).toBe(
          "https://redis.example.com",
        );
        expect(env.UPSTASH_REDIS_REST_TOKEN).toBe(
          "strongtokenstrongtokenstrongtoken!!",
        );
      },
    );
  });

  it("rejects partial redis config", async () => {
    await expect(
      withEnv(
        {
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: "https://redis.example.com",
        },
        () => importCore(),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });

  it("defaults to memory when redis vars missing", async () => {
    await withEnv({}, async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv();
      expect(env.SESSION_STORE).toBeUndefined();
      expect(env.UPSTASH_REDIS_REST_URL).toBeUndefined();
    });
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

describe("NODE_ENV branches", () => {
  it("defaults CART_COOKIE_SECRET in test", async () => {
    await withEnv({ NODE_ENV: "test", CART_COOKIE_SECRET: undefined }, async () => {
      const { loadCoreEnv } = await importCore();
      const env = loadCoreEnv();
      expect(env.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    });
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
        () => importCore(),
      ),
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
      },
    );
  });
});

