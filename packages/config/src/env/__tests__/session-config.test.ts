import { describe, it, expect } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";
import {
  NEXT_SECRET,
  SESSION_SECRET,
  REDIS_URL,
  REDIS_TOKEN,
  DEV_NEXTAUTH_SECRET,
  DEV_SESSION_SECRET,
  selectStore,
} from "./authEnvTestUtils";

describe("authEnvSchema basics", () => {
  it("accepts minimal valid environment", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
    });
    expect(result.success).toBe(true);
  });
});

describe("authEnvSchema session store", () => {
  const baseEnv = { NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET };

  it("requires redis url when SESSION_STORE=redis", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["UPSTASH_REDIS_REST_URL"],
          message:
            "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
        }),
      ]),
    );
  });

  it("requires redis token when SESSION_STORE=redis", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: REDIS_URL,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["UPSTASH_REDIS_REST_TOKEN"],
          message:
            "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
        }),
      ]),
    );
  });

  it("accepts redis store when credentials provided", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: REDIS_URL,
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(result.success).toBe(true);
  });
});

describe("auth env session configuration", () => {
  it("throws when SESSION_SECRET is missing", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: undefined,
        },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("loads when SESSION_SECRET is provided", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
      },
      () => import("../auth"),
    );

    expect(authEnv.SESSION_SECRET).toBe(SESSION_SECRET);
  });

  it("selects redis when explicitly configured", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      () => import("../auth"),
    );

    expect(selectStore(authEnv)).toBe("redis");
  });

  it("prefers memory when explicitly set", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        SESSION_STORE: "memory",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      () => import("../auth"),
    );

    expect(selectStore(authEnv)).toBe("memory");
  });

  it("falls back to redis when creds present without explicit store", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      () => import("../auth"),
    );

    expect(selectStore(authEnv)).toBe("redis");
  });

  it("falls back to memory when no store or creds provided", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
      },
      () => import("../auth"),
    );

    expect(selectStore(authEnv)).toBe("memory");
  });
});

describe("SESSION_STORE=redis", () => {
  const base = {
    NODE_ENV: "production",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
  } as const;

  describe.each([
    ["missing UPSTASH_REDIS_REST_URL", { UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN }],
    ["missing UPSTASH_REDIS_REST_TOKEN", { UPSTASH_REDIS_REST_URL: REDIS_URL }],
  ])("throws when %s", (_, extra) => {
    it("throws", async () => {
      await expect(
        withEnv(
          { ...base, SESSION_STORE: "redis", ...extra },
          () => import("../auth"),
        ),
      ).rejects.toThrow("Invalid auth environment variables");
    });
  });

  it("loads when redis credentials are provided", async () => {
    const { authEnv } = await withEnv(
      {
        ...base,
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      () => import("../auth"),
    );
    expect(selectStore(authEnv)).toBe("redis");
  });
});

describe("development defaults", () => {
  it("applies dev secrets when NODE_ENV is not production", async () => {
    const { authEnv } = await withEnv(
      { NODE_ENV: "development", NEXTAUTH_SECRET: undefined, SESSION_SECRET: undefined },
      () => import("../auth"),
    );
    expect(authEnv.NEXTAUTH_SECRET).toBe(DEV_NEXTAUTH_SECRET);
    expect(authEnv.SESSION_SECRET).toBe(DEV_SESSION_SECRET);
  });
});
