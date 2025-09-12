import { describe, it, expect } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";
import { NEXT_SECRET, SESSION_SECRET } from "./authEnvTestUtils";

describe("AUTH_TOKEN_TTL normalization", () => {
  const baseVars = {
    NODE_ENV: "production",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
  };

  it("removes blank AUTH_TOKEN_TTL", async () => {
    await withEnv(
      { ...baseVars, AUTH_TOKEN_TTL: "" },
      async () => {
        await import("../auth");
        expect(process.env.AUTH_TOKEN_TTL).toBeUndefined();
      },
    );
  });

  it("appends seconds to numeric AUTH_TOKEN_TTL", async () => {
    await withEnv(
      { ...baseVars, AUTH_TOKEN_TTL: "60" },
      async () => {
        await import("../auth");
        expect(process.env.AUTH_TOKEN_TTL).toBe("60s");
      },
    );
  });

  it.each([
    ["15m", "15m"],
    ["30 s", "30s"],
    ["45S", "45s"],
    [" 5 M ", "5m"],
  ])("normalizes unit string '%s' to '%s'", async (input, output) => {
    await withEnv(
      { ...baseVars, AUTH_TOKEN_TTL: input },
      async () => {
        await import("../auth");
        expect(process.env.AUTH_TOKEN_TTL).toBe(output);
      },
    );
  });
});

describe("authEnv expiry", () => {
  it("sets AUTH_TOKEN_EXPIRES_AT based on AUTH_TOKEN_TTL", async () => {
    const start = Date.now();
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_TOKEN_TTL: "1s",
      },
      () => import("../auth"),
    );
    const diff = authEnv.AUTH_TOKEN_EXPIRES_AT.getTime() - start;
    expect(diff).toBeGreaterThanOrEqual(1000);
    expect(diff).toBeLessThan(2000);
  });

  it("normalizes TTL before computing expiration", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_TOKEN_TTL: " 2 M ",
      },
      () => import("../auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(120);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:02:00.000Z",
    );
    jest.useRealTimers();
  });
});

describe("AUTH_TOKEN_TTL parsing", () => {
  const base = {
    NODE_ENV: "production",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
  } as const;

  it.each([
    ["60", 60],
    ["2m", 120],
  ])("converts %s into %d seconds", async (input, expected) => {
    const { authEnv } = await withEnv(
      { ...base, AUTH_TOKEN_TTL: input },
      () => import("../auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(expected);
  });

  it("rejects invalid TTL strings", async () => {
    await expect(
      withEnv(
        { ...base, AUTH_TOKEN_TTL: "1h" },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });
});
