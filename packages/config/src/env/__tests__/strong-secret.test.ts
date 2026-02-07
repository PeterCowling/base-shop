import { describe, expect,it } from "@jest/globals";

import { expectInvalidAuthEnvWithConfigEnv } from "../../../test/utils/expectInvalidAuthEnv";

import {
  NEXT_SECRET,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
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

describe("strongSecret validation", () => {
  it("rejects secrets shorter than 32 characters", async () => {
    await expectInvalidProd({ NEXTAUTH_SECRET: "short" }, (env) => env.NEXTAUTH_SECRET);
  });

  it("rejects secrets with non-printable characters", async () => {
    await expectInvalidProd({ NEXTAUTH_SECRET: `${"a".repeat(31)}\n` }, (env) => env.NEXTAUTH_SECRET);
  });

  it("rejects session secret shorter than 32 characters", async () => {
    await expectInvalidProd({ NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET: "short" }, (env) => env.SESSION_SECRET);
  });

  it("rejects session secret with non-printable characters", async () => {
    await expectInvalidProd(
      { NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET: `${"a".repeat(31)}\n` },
      (env) => env.SESSION_SECRET,
    );
  });
});
