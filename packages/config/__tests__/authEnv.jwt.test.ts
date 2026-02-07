import { expect } from "@jest/globals";

import { expectInvalidAuthEnvWithConfigEnv as expectInvalidAuth } from "../test/utils/expectInvalidAuthEnv";
import { withEnv } from "../test/utils/withEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const STRONG_TOKEN = "token-value-32-chars-long-string!!";

describe("authEnv - JWT provider and strongSecret schema", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("strongSecret schema", () => {
    it("rejects secrets shorter than 32 characters", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          AUTH_PROVIDER: "jwt",
          JWT_SECRET: "short",
        },
        accessor: (auth) => auth.authEnv.JWT_SECRET,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });

    it("rejects secrets with non-printable ASCII characters", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          AUTH_PROVIDER: "jwt",
          JWT_SECRET: `${"a".repeat(31)}\n`,
        },
        accessor: (auth) => auth.authEnv.JWT_SECRET,
        consoleErrorSpy: spy,
      });
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });
  });

  it("throws and logs when JWT_SECRET is missing for JWT provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidAuth({
      env: {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_PROVIDER: "jwt",
      },
      accessor: (auth) => auth.authEnv.JWT_SECRET,
      consoleErrorSpy: spy,
    });
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
  });

  it("parses JWT credentials when provided", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_PROVIDER: "jwt",
        JWT_SECRET: STRONG_TOKEN,
      },
      () => import("../src/env/auth"),
    );
    expect(authEnv).toMatchObject({
      AUTH_PROVIDER: "jwt",
      JWT_SECRET: STRONG_TOKEN,
    });
    expect(spy).not.toHaveBeenCalled();
  });
});

