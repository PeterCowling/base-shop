import { describe, it, expect } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";
import { expectInvalidAuthEnvWithConfigEnv } from "../../../test/utils/expectInvalidAuthEnv";
import { NEXT_SECRET, SESSION_SECRET, REDIS_URL, REDIS_TOKEN } from "./authEnvTestUtils";

type EnvOverrides = Record<string, string | undefined>;

const prodEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  NODE_ENV: "production",
  NEXTAUTH_SECRET: NEXT_SECRET,
  SESSION_SECRET,
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

describe("authEnvSchema redis credentials", () => {
  const baseEnv = { NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET };

  it("requires token when LOGIN_RATE_LIMIT_REDIS_URL is set", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["LOGIN_RATE_LIMIT_REDIS_TOKEN"],
          message:
            "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
        }),
      ]),
    );
  });

  it("requires url when LOGIN_RATE_LIMIT_REDIS_TOKEN is set", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["LOGIN_RATE_LIMIT_REDIS_URL"],
          message:
            "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
        }),
      ]),
    );
  });

  it("accepts login rate limit redis credentials when both provided", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
    });
    expect(result.success).toBe(true);
  });
});

describe("login rate limit redis credentials", () => {
  const base = prodEnv();

  describe.each([
    ["missing LOGIN_RATE_LIMIT_REDIS_URL", { LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN }],
    ["missing LOGIN_RATE_LIMIT_REDIS_TOKEN", { LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL }],
  ])("throws when %s", (_, extra) => {
    it("throws", async () => {
      const accessor = "LOGIN_RATE_LIMIT_REDIS_URL" in extra
        ? (env: Record<string, unknown>) => env.LOGIN_RATE_LIMIT_REDIS_TOKEN
        : (env: Record<string, unknown>) => env.LOGIN_RATE_LIMIT_REDIS_URL;
      await expectInvalidProd(extra, accessor);
    });
  });

  it("loads when rate limit redis credentials provided", async () => {
    const { authEnv } = await withEnv(
      prodEnv({
        LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
        LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
      }),
      () => import("../auth"),
    );
    expect(authEnv.LOGIN_RATE_LIMIT_REDIS_URL).toBe(REDIS_URL);
    expect(authEnv.LOGIN_RATE_LIMIT_REDIS_TOKEN).toBe(REDIS_TOKEN);
  });
});
