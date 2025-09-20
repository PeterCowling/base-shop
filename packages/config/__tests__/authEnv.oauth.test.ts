import { expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";
import { expectInvalidAuthEnvWithConfigEnv as expectInvalidAuth } from "../test/utils/expectInvalidAuthEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const STRONG_TOKEN = "token-value-32-chars-long-string!!";

describe("authEnv - OAuth provider", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws and logs when OAUTH_CLIENT_ID is missing", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidAuth({
      env: {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_PROVIDER: "oauth",
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

  it("throws and logs when OAUTH_CLIENT_SECRET is missing", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidAuth({
      env: {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "client-id",
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

  it("parses OAuth credentials when provided", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "client-id",
        OAUTH_CLIENT_SECRET: STRONG_TOKEN,
      },
      () => import("../src/env/auth"),
    );
    expect(authEnv).toMatchObject({
      AUTH_PROVIDER: "oauth",
      OAUTH_CLIENT_ID: "client-id",
      OAUTH_CLIENT_SECRET: STRONG_TOKEN,
    });
    expect(spy).not.toHaveBeenCalled();
  });
});

