import { expect } from "@jest/globals";

import { expectInvalidAuthEnvWithConfigEnv as expectInvalidAuth } from "../test/utils/expectInvalidAuthEnv";
import { withEnv } from "../test/utils/withEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const DEV_NEXT_SECRET = "dev-nextauth-secret-32-chars-long-string!";
const DEV_SESSION_SECRET = "dev-session-secret-32-chars-long-string!";

describe("authEnv - secrets", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses development defaults for secrets", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "development",
        NEXTAUTH_SECRET: undefined,
        SESSION_SECRET: undefined,
      },
      () => import("../src/env/auth"),
    );

    expect(authEnv.NEXTAUTH_SECRET).toBe(DEV_NEXT_SECRET);
    expect(authEnv.SESSION_SECRET).toBe(DEV_SESSION_SECRET);
  });

  it("throws and logs when NEXTAUTH_SECRET is missing in production", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expectInvalidAuth({
      env: {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: undefined,
        SESSION_SECRET,
      },
      accessor: (auth) => auth.authEnv.NEXTAUTH_SECRET,
      consoleErrorSpy: spy,
    });
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
  });

  it("throws and logs when SESSION_SECRET is missing in production", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expectInvalidAuth({
      env: {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET: undefined,
      },
      accessor: (auth) => auth.authEnv.SESSION_SECRET,
      consoleErrorSpy: spy,
    });
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        SESSION_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
  });
});

