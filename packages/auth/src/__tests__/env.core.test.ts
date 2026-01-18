import { afterEach, describe, expect, it } from "@jest/globals";
import { createExpectInvalidAuthEnv } from "../../../config/test/utils/expectInvalidAuthEnv";

const ORIGINAL_ENV = {
  ...process.env,
  EMAIL_FROM: "from@example.com",
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
  SANITY_PROJECT_ID: "project",
  SANITY_DATASET: "production",
  SANITY_API_TOKEN: "token",
  SANITY_PREVIEW_SECRET: "secret",
};

const withEnv = async <T>(
  env: Record<string, string | number | undefined>,
  fn: () => Promise<T> | T,
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

const expectInvalidAuth = createExpectInvalidAuthEnv(withEnv);

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("happy path", () => {
  it("parses known keys with correct types", async () => {
    await withEnv(
      {
        CART_TTL: "45",
        COOKIE_DOMAIN: "example.com",
        NEXT_PUBLIC_BASE_URL: "https://shop.example.com",
      },
      async () => {
        const { loadCoreEnv } = await import("@acme/config/env/core");
        const env = loadCoreEnv();
        expect(env.CART_TTL).toBe(45);
        expect(env.COOKIE_DOMAIN).toBe("example.com");
        expect(env.NEXT_PUBLIC_BASE_URL).toBe("https://shop.example.com");
      },
    );
  });
});

describe("boolean matrix", () => {
  const getRequire = async () => (await import("@acme/config/env/core")).requireEnv;

  it.each([
    ["true", true],
    ["1", true],
    ["TrUe", true],
    ["false", false],
    ["0", false],
  ])("parses %s", async (raw, expected) => {
    await withEnv({ FLAG: raw }, async () => {
      const requireEnv = await getRequire();
      expect(requireEnv("FLAG", "boolean")).toBe(expected);
    });
  });

  it("rejects invalid boolean", async () => {
    await withEnv({ FLAG: "no" }, async () => {
      const requireEnv = await getRequire();
      expect(() => requireEnv("FLAG", "boolean")).toThrow();
    });
  });
});

describe("number and url validation", () => {
  it("rejects invalid number", async () => {
    await withEnv({ CART_TTL: "abc" }, async () => {
      const { loadCoreEnv } = await import("@acme/config/env/core");
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    });
  });

  it("rejects invalid url", async () => {
    await withEnv({ NEXT_PUBLIC_BASE_URL: "not a url" }, async () => {
      const { loadCoreEnv } = await import("@acme/config/env/core");
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
        UPSTASH_REDIS_REST_TOKEN: "strongtokenstrongtokenstrongtoken!!",
      },
      async () => {
        const { loadCoreEnv } = await import("@acme/config/env/core");
        const env = loadCoreEnv();
        expect(env.SESSION_STORE).toBe("redis");
        expect(env.UPSTASH_REDIS_REST_URL).toBe("https://redis.example.com");
        expect(env.UPSTASH_REDIS_REST_TOKEN).toBe(
          "strongtokenstrongtokenstrongtoken!!",
        );
      },
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
    await withEnv({}, async () => {
      const { loadCoreEnv } = await import("@acme/config/env/core");
      const env = loadCoreEnv();
      expect(env.SESSION_STORE).toBeUndefined();
      expect(env.UPSTASH_REDIS_REST_URL).toBeUndefined();
    });
  });
});
