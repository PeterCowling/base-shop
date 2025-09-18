import { expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";
import { expectInvalidAuthEnvWithConfigEnv as expectInvalidAuth } from "../test/utils/expectInvalidAuthEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const STRONG_TOKEN = "token-value-32-chars-long-string!!";

describe("auth-env", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("session store redis", () => {
    it("errors without UPSTASH_REDIS_REST_URL", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
          UPSTASH_REDIS_REST_URL: undefined,
        },
        accessor: (auth) => auth.authEnv.UPSTASH_REDIS_REST_URL,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          UPSTASH_REDIS_REST_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });

    it("errors without UPSTASH_REDIS_REST_TOKEN", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: "https://example.com",
          UPSTASH_REDIS_REST_TOKEN: undefined,
        },
        accessor: (auth) => auth.authEnv.UPSTASH_REDIS_REST_TOKEN,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          UPSTASH_REDIS_REST_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });

    it("succeeds when redis config is complete", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { authEnv } = await withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: "https://example.com",
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
        },
        () => import("../src/env/auth"),
      );
      expect(authEnv).toMatchObject({
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://example.com",
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("login rate limit redis", () => {
    it("errors when only LOGIN_RATE_LIMIT_REDIS_URL is set", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          LOGIN_RATE_LIMIT_REDIS_TOKEN: undefined,
          LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
        },
        accessor: (auth) => auth.authEnv.LOGIN_RATE_LIMIT_REDIS_TOKEN,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          LOGIN_RATE_LIMIT_REDIS_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });

    it("errors when only LOGIN_RATE_LIMIT_REDIS_TOKEN is set", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
          LOGIN_RATE_LIMIT_REDIS_URL: undefined,
        },
        accessor: (auth) => auth.authEnv.LOGIN_RATE_LIMIT_REDIS_URL,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          LOGIN_RATE_LIMIT_REDIS_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });

    it("succeeds when both URL and token are set", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { authEnv } = await withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
          LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
        },
        () => import("../src/env/auth"),
      );
      expect(authEnv).toMatchObject({
        LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
        LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
      });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("auth providers", () => {
    it("errors when JWT_SECRET missing for jwt provider", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          AUTH_PROVIDER: "jwt",
          JWT_SECRET: undefined,
        },
        accessor: (auth) => auth.authEnv.JWT_SECRET,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });

    it("parses jwt credentials when provided", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { authEnv } = await withEnv(
        {
            NODE_ENV: "production",
            NEXTAUTH_SECRET: NEXT_SECRET,
            SESSION_SECRET,
            AUTH_PROVIDER: "jwt",
            JWT_SECRET: STRONG_TOKEN,
        },
        () => import("../src/env/auth"),
      );
      expect(authEnv).toMatchObject({ AUTH_PROVIDER: "jwt", JWT_SECRET: STRONG_TOKEN });
      expect(spy).not.toHaveBeenCalled();
    });

    it("errors when OAUTH_CLIENT_ID missing for oauth provider", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          AUTH_PROVIDER: "oauth",
          OAUTH_CLIENT_ID: undefined,
          OAUTH_CLIENT_SECRET: STRONG_TOKEN,
        },
        accessor: (auth) => auth.authEnv.OAUTH_CLIENT_ID,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          OAUTH_CLIENT_ID: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });

    it("errors when OAUTH_CLIENT_SECRET missing for oauth provider", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          AUTH_PROVIDER: "oauth",
          OAUTH_CLIENT_ID: "client-id",
          OAUTH_CLIENT_SECRET: undefined,
        },
        accessor: (auth) => auth.authEnv.OAUTH_CLIENT_SECRET,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          OAUTH_CLIENT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });
  });

  describe("AUTH_TOKEN_TTL preprocessing", () => {
    const base = {
      NODE_ENV: "development",
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
    } as const;

    it("appends seconds to numeric strings", async () => {
      const { snapshot, authEnv } = await withEnv(
        { ...base, AUTH_TOKEN_TTL: "60" },
        async () => {
          const mod = await import("../src/env/auth");
          return { snapshot: { ...process.env }, authEnv: mod.authEnv };
        },
      );
      expect(snapshot.AUTH_TOKEN_TTL).toBe("60s");
      expect(authEnv.AUTH_TOKEN_TTL).toBe(60);
    });

    it("parses minute strings", async () => {
      const { snapshot, authEnv } = await withEnv(
        { ...base, AUTH_TOKEN_TTL: "2m" },
        async () => {
          const mod = await import("../src/env/auth");
          return { snapshot: { ...process.env }, authEnv: mod.authEnv };
        },
      );
      expect(snapshot.AUTH_TOKEN_TTL).toBe("2m");
      expect(authEnv.AUTH_TOKEN_TTL).toBe(120);
    });

    it("defaults when blank", async () => {
      const { snapshot, authEnv } = await withEnv(
        { ...base, AUTH_TOKEN_TTL: "" },
        async () => {
          const mod = await import("../src/env/auth");
          return { snapshot: { ...process.env }, authEnv: mod.authEnv };
        },
      );
      expect(snapshot.AUTH_TOKEN_TTL).toBeUndefined();
      expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    });

    it("rejects numeric values", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: { ...base, AUTH_TOKEN_TTL: 30 as any },
        accessor: (auth) => auth.authEnv.AUTH_TOKEN_TTL,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          AUTH_TOKEN_TTL: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });
  });
});
