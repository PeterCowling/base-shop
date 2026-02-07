import { describe, expect,it } from "@jest/globals";

import { withEnv } from "../../../test/utils/withEnv";

import { type BoolKey,NEXT_SECRET, SESSION_SECRET } from "./authEnvTestUtils";

describe("boolean coercions and defaults", () => {
  const baseVars = { NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET };

  it.each([
    [1, true],
    [0, false],
  ])("coerces ALLOW_GUEST=%s", async (input, expected) => {
    const { authEnv } = await withEnv(
      { ...baseVars, ALLOW_GUEST: input as any },
      () => import("../auth"),
    );
    expect(authEnv.ALLOW_GUEST).toBe(expected);
  });

  it.each([
    [1, true],
    [0, false],
  ])("coerces ENFORCE_2FA=%s", async (input, expected) => {
    const { authEnv } = await withEnv(
      { ...baseVars, ENFORCE_2FA: input as any },
      () => import("../auth"),
    );
    expect(authEnv.ENFORCE_2FA).toBe(expected);
  });

  it("defaults ALLOW_GUEST and ENFORCE_2FA to false", async () => {
    const { authEnv } = await withEnv(baseVars, () => import("../auth"));
    expect(authEnv.ALLOW_GUEST).toBe(false);
    expect(authEnv.ENFORCE_2FA).toBe(false);
  });
});

describe.each(["ALLOW_GUEST", "ENFORCE_2FA"] as const)(
  "%s boolean coercion",
  (key: BoolKey) => {
    it.each([
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
    ])("parses %s", async (input, expected) => {
      const { authEnv } = await withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          [key]: input,
        },
        () => import("../auth"),
      );
      expect((authEnv as Record<BoolKey, boolean>)[key]).toBe(expected);
    });
  },
);
