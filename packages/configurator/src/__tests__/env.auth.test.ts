import { describe, it, expect, afterEach } from "@jest/globals";
import { withEnv } from "../../../config/test/utils/withEnv";

const STRONG_TOKEN = "strongtokenstrongtokenstrongtoken!!";
const REDIS_URL = "https://redis.example.com";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AUTH_TOKEN_TTL normalisation", () => {
  it("normalises stray spaces and units", async () => {
    const { authEnv, normalized } = await withEnv(
      { AUTH_TOKEN_TTL: " 5 m ", NODE_ENV: "development" },
      async () => {
        const mod = await import("@acme/config/src/env/auth.ts");
        return { authEnv: mod.authEnv, normalized: process.env.AUTH_TOKEN_TTL };
      },
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(300);
    expect(normalized).toBe("5m");
  });
});

describe("redis session store requirements", () => {
  it("requires redis token", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { SESSION_STORE: "redis", UPSTASH_REDIS_REST_URL: REDIS_URL },
        () => import("@acme/config/src/env/auth.ts"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("requires redis url", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { SESSION_STORE: "redis", UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN },
        () => import("@acme/config/src/env/auth.ts"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("parses redis config when url and token present", async () => {
    const { authEnv } = await withEnv(
      {
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      },
      () => import("@acme/config/src/env/auth.ts"),
    );
    expect(authEnv.SESSION_STORE).toBe("redis");
  });
});

describe("rate limit redis credentials", () => {
  it("requires token when url provided", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL },
        () => import("@acme/config/src/env/auth.ts"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("requires url when token provided", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN },
        () => import("@acme/config/src/env/auth.ts"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("auth provider specific checks", () => {
  it("requires JWT_SECRET for jwt provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { AUTH_PROVIDER: "jwt" },
        () => import("@acme/config/src/env/auth.ts"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("parses jwt provider when secret present", async () => {
    const { authEnv } = await withEnv(
      { AUTH_PROVIDER: "jwt", JWT_SECRET: STRONG_TOKEN },
      () => import("@acme/config/src/env/auth.ts"),
    );
    expect(authEnv.AUTH_PROVIDER).toBe("jwt");
  });

  it("requires OAUTH_CLIENT_ID for oauth provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_SECRET: STRONG_TOKEN },
        () => import("@acme/config/src/env/auth.ts"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("requires OAUTH_CLIENT_SECRET for oauth provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_ID: "client-id" },
        () => import("@acme/config/src/env/auth.ts"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("parses oauth provider when credentials present", async () => {
    const { authEnv } = await withEnv(
      {
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "client-id",
        OAUTH_CLIENT_SECRET: STRONG_TOKEN,
      },
      () => import("@acme/config/src/env/auth.ts"),
    );
    expect(authEnv.AUTH_PROVIDER).toBe("oauth");
  });
});

