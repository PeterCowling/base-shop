import { expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";
import { expectInvalidAuthEnvWithConfigEnv as expectInvalidAuth } from "../test/utils/expectInvalidAuthEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";

describe("authEnv - AUTH_TOKEN_TTL", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ["60s", 60],
    ["2m", 120],
  ])("parses TTL %s into %d seconds", async (input, expected) => {
    const { authEnv } = await withEnv(
      { NODE_ENV: "test", AUTH_TOKEN_TTL: input },
      () => import("../src/env/auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(expected);
  });

  describe("normalization", () => {
    const baseVars = {
      NODE_ENV: "development",
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
    } as const;

    it("removes blank AUTH_TOKEN_TTL", async () => {
      const { snapshot, authEnv } = await withEnv(
        { ...baseVars, AUTH_TOKEN_TTL: "" },
        async () => {
          const mod = await import("../src/env/auth");
          return { snapshot: { ...process.env }, authEnv: mod.authEnv };
        },
      );
      expect(snapshot.AUTH_TOKEN_TTL).toBeUndefined();
      expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    });

    it("appends seconds to numeric AUTH_TOKEN_TTL", async () => {
      const { snapshot, authEnv } = await withEnv(
        { ...baseVars, AUTH_TOKEN_TTL: "10" },
        async () => {
          const mod = await import("../src/env/auth");
          return { snapshot: { ...process.env }, authEnv: mod.authEnv };
        },
      );
      expect(snapshot.AUTH_TOKEN_TTL).toBe("10s");
      expect(authEnv.AUTH_TOKEN_TTL).toBe(10);
    });

    it("trims and normalizes AUTH_TOKEN_TTL with trailing spaces", async () => {
      const { snapshot, authEnv } = await withEnv(
        { ...baseVars, AUTH_TOKEN_TTL: "60 " },
        async () => {
          const mod = await import("../src/env/auth");
          return { snapshot: { ...process.env }, authEnv: mod.authEnv };
        },
      );
      expect(snapshot.AUTH_TOKEN_TTL).toBe("60s");
      expect(authEnv.AUTH_TOKEN_TTL).toBe(60);
    });

    it("normalizes AUTH_TOKEN_TTL with spaces before unit", async () => {
      const { snapshot, authEnv } = await withEnv(
        { ...baseVars, AUTH_TOKEN_TTL: "5 m" },
        async () => {
          const mod = await import("../src/env/auth");
          return { snapshot: { ...process.env }, authEnv: mod.authEnv };
        },
      );
      expect(snapshot.AUTH_TOKEN_TTL).toBe("5m");
      expect(authEnv.AUTH_TOKEN_TTL).toBe(300);
    });

    it("throws and logs on invalid AUTH_TOKEN_TTL values", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: { ...baseVars, AUTH_TOKEN_TTL: "xyz" },
        accessor: (auth) => auth.authEnv.AUTH_TOKEN_TTL,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          AUTH_TOKEN_TTL: {
            _errors: expect.arrayContaining([
              "AUTH_TOKEN_TTL must be a string like '60s' or '15m'",
            ]),
          },
        }),
      );
    });
  });

  it("applies defaults and computes token expiry", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
      },
      () => import("../src/env/auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    expect(authEnv.TOKEN_ALGORITHM).toBe("HS256");
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:15:00.000Z",
    );
    jest.useRealTimers();
  });
});

