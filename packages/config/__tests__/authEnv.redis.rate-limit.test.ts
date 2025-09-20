import { expect } from "@jest/globals";
import { expectInvalidAuthEnvWithConfigEnv as expectInvalidAuth } from "../test/utils/expectInvalidAuthEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const STRONG_TOKEN = "token-value-32-chars-long-string!!";

describe("authEnv - login rate limit redis", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws and logs when only LOGIN_RATE_LIMIT_REDIS_URL is set", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expectInvalidAuth({
      env: {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
      },
      accessor: (auth) => auth.authEnv.LOGIN_RATE_LIMIT_REDIS_TOKEN,
      consoleErrorSpy: spy,
    });
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
  });

  it("throws and logs when only LOGIN_RATE_LIMIT_REDIS_TOKEN is set", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expectInvalidAuth({
      env: {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
      },
      accessor: (auth) => auth.authEnv.LOGIN_RATE_LIMIT_REDIS_URL,
      consoleErrorSpy: spy,
    });
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
  });
});

