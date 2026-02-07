import { describe, expect, it, jest } from "@jest/globals";
import { type z } from "zod";

import { createExpectInvalidAuthEnv } from "../../../test/utils/expectInvalidAuthEnv";
import { withEnv } from "../../../test/utils/withEnv";

import {
  NEXT_SECRET,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  REDIS_TOKEN,
  REDIS_URL,
  SESSION_SECRET,
} from "./authEnvTestUtils";

const base = {
  NODE_ENV: "test",
  NEXTAUTH_SECRET: NEXT_SECRET,
  SESSION_SECRET,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
};

const expectInvalidAuth = createExpectInvalidAuthEnv(withEnv);

const OAUTH_CLIENT_ID = "client-id";
const OAUTH_CLIENT_SECRET =
  "oauth-client-secret-32-chars-long-string!!";

describe("booleanFromString refinement", () => {
  it("coerces numeric strings and numbers", async () => {
    await withEnv(base, async () => {
      const { authEnvSchema } = await import("../auth");
      const schema = (
        authEnvSchema._def.schema as z.ZodObject<any>
      ).shape.ALLOW_GUEST;
      expect(schema.parse("1")).toBe(true);
      expect(schema.parse("0")).toBe(false);
      expect(schema.parse(1 as any)).toBe(true);
      expect(schema.parse(0 as any)).toBe(false);
    });
  });

  it("errors on unexpected inputs", async () => {
    await withEnv(base, async () => {
      const { authEnvSchema } = await import("../auth");
      const schema = (
        authEnvSchema._def.schema as z.ZodObject<any>
      ).shape.ALLOW_GUEST;
      expect(() => schema.parse("yes")).toThrow();
      expect(() => schema.parse(2 as any)).toThrow();
    });
  });

  it("defaults to false when undefined", async () => {
    await withEnv(base, async () => {
      const { authEnvSchema } = await import("../auth");
      const schema = (
        authEnvSchema._def.schema as z.ZodObject<any>
      ).shape.ALLOW_GUEST;
      expect(schema.parse(undefined)).toBe(false);
    });
  });
});

describe("authEnvSchema.superRefine", () => {
  const baseEnv = {
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
    OAUTH_ISSUER,
    OAUTH_REDIRECT_ORIGIN,
  };

  it("errors when SESSION_STORE=redis without credentials", async () => {
    await withEnv(base, async () => {
      const { authEnvSchema } = await import("../auth");
      const result = authEnvSchema.safeParse({
        ...baseEnv,
        SESSION_STORE: "redis",
      } as any);
      expect(result.success).toBe(false);
      const errors = (result as any).error.format();
      expect(errors).toHaveProperty("UPSTASH_REDIS_REST_URL");
      expect(errors).toHaveProperty("UPSTASH_REDIS_REST_TOKEN");
    });
  });

  it("errors when only one login rate limit credential is provided", async () => {
    await withEnv(base, async () => {
      const { authEnvSchema } = await import("../auth");
      const urlOnly = authEnvSchema.safeParse({
        ...baseEnv,
        LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
      } as any);
      expect(urlOnly.success).toBe(false);
      expect((urlOnly as any).error.format()).toHaveProperty(
        "LOGIN_RATE_LIMIT_REDIS_TOKEN",
      );

      const tokenOnly = authEnvSchema.safeParse({
        ...baseEnv,
        LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
      } as any);
      expect(tokenOnly.success).toBe(false);
      expect((tokenOnly as any).error.format()).toHaveProperty(
        "LOGIN_RATE_LIMIT_REDIS_URL",
      );
    });
  });

  it("errors when AUTH_PROVIDER=jwt without JWT_SECRET", async () => {
    await withEnv(base, async () => {
      const { authEnvSchema } = await import("../auth");
      const result = authEnvSchema.safeParse({
        ...baseEnv,
        AUTH_PROVIDER: "jwt",
      } as any);
      expect(result.success).toBe(false);
      expect((result as any).error.format()).toHaveProperty("JWT_SECRET");
    });
  });

  it.each([
    ["missing client id", { OAUTH_CLIENT_SECRET }, "OAUTH_CLIENT_ID"],
    ["missing client secret", { OAUTH_CLIENT_ID }, "OAUTH_CLIENT_SECRET"],
  ])(
    "errors when AUTH_PROVIDER=oauth with %s",
    async (_label, extra, missing) => {
      await withEnv(base, async () => {
        const { authEnvSchema } = await import("../auth");
        const result = authEnvSchema.safeParse({
          ...baseEnv,
          AUTH_PROVIDER: "oauth",
          ...extra,
        } as any);
        expect(result.success).toBe(false);
        expect((result as any).error.format()).toHaveProperty(missing);
      });
    },
  );
});

describe("loadAuthEnv logging", () => {
  it("logs before throwing on invalid env", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidAuth({
        env: base,
        accessor: (auth) =>
          auth.loadAuthEnv({
            NEXTAUTH_SECRET: NEXT_SECRET,
            SESSION_SECRET,
            AUTH_PROVIDER: "jwt",
          } as any),
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
