import { describe, expect,it } from "@jest/globals";

import { expectInvalidAuthEnvWithConfigEnv } from "../../../test/utils/expectInvalidAuthEnv";
import { withEnv } from "../../../test/utils/withEnv";

import {
  NEXT_SECRET,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  REDIS_TOKEN,
  SESSION_SECRET,
} from "./authEnvTestUtils";

type EnvOverrides = Record<string, string | undefined>;

const prodEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  NODE_ENV: "production",
  NEXTAUTH_SECRET: NEXT_SECRET,
  SESSION_SECRET,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  ...overrides,
});

const expectInvalidProd = (
  overrides: EnvOverrides,
  accessor: (env: Record<string, unknown>) => unknown,
) =>
  expectInvalidAuthEnvWithConfigEnv({
    env: prodEnv(overrides),
    accessor: (auth) => accessor(auth.authEnv as Record<string, unknown>),
  });

describe("authEnvSchema provider credentials", () => {
  const baseEnv = {
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
    OAUTH_ISSUER,
    OAUTH_REDIRECT_ORIGIN,
  };

  it("requires JWT_SECRET when AUTH_PROVIDER=jwt", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      AUTH_PROVIDER: "jwt",
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["JWT_SECRET"],
          message: "JWT_SECRET is required when AUTH_PROVIDER=jwt",
        }),
      ]),
    );
  });

  it("accepts JWT provider with secret", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      AUTH_PROVIDER: "jwt",
      JWT_SECRET: REDIS_TOKEN,
    });
    expect(result.success).toBe(true);
  });

  it("requires OAuth credentials when AUTH_PROVIDER=oauth", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      AUTH_PROVIDER: "oauth",
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["OAUTH_CLIENT_ID"],
          message: "OAUTH_CLIENT_ID is required when AUTH_PROVIDER=oauth",
        }),
        expect.objectContaining({
          path: ["OAUTH_CLIENT_SECRET"],
          message: "OAUTH_CLIENT_SECRET is required when AUTH_PROVIDER=oauth",
        }),
      ]),
    );
  });

  it("accepts OAuth provider with credentials", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      AUTH_PROVIDER: "oauth",
      OAUTH_CLIENT_ID: "client-id",
      OAUTH_CLIENT_SECRET: REDIS_TOKEN,
    });
    expect(result.success).toBe(true);
  });
});

describe("AUTH_PROVIDER credentials", () => {
  const base = prodEnv();

  describe.each([
    [
      "jwt",
      { AUTH_PROVIDER: "jwt", JWT_SECRET: undefined },
      { AUTH_PROVIDER: "jwt", JWT_SECRET: SESSION_SECRET },
    ],
    [
      "oauth",
      {
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: undefined,
        OAUTH_CLIENT_SECRET: undefined,
      },
      {
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "client-id",
        OAUTH_CLIENT_SECRET: REDIS_TOKEN,
      },
    ],
  ] as const)("AUTH_PROVIDER=%s", (provider, badVars, goodVars) => {
    it("fails without credentials", async () => {
      const accessor =
        badVars.AUTH_PROVIDER === "jwt"
          ? (env: Record<string, unknown>) => env.JWT_SECRET
          : (env: Record<string, unknown>) => env.OAUTH_CLIENT_ID;
      await expectInvalidProd(badVars, accessor);
    });

    it("succeeds with credentials", async () => {
      const { authEnv } = await withEnv(prodEnv(goodVars), () => import("../auth"));
      expect(authEnv.AUTH_PROVIDER).toBe(provider);
    });
  });
});
