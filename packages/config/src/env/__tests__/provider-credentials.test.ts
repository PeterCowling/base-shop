import { describe, it, expect } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";
import { NEXT_SECRET, SESSION_SECRET, REDIS_TOKEN } from "./authEnvTestUtils";

describe("authEnvSchema provider credentials", () => {
  const baseEnv = { NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET };

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
  const base = {
    NODE_ENV: "production",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
  } as const;

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
      await expect(
        withEnv({ ...base, ...badVars }, () => import("../auth")),
      ).rejects.toThrow("Invalid auth environment variables");
    });

    it("succeeds with credentials", async () => {
      const { authEnv } = await withEnv(
        { ...base, ...goodVars },
        () => import("../auth"),
      );
      expect(authEnv.AUTH_PROVIDER).toBe(provider);
    });
  });
});
