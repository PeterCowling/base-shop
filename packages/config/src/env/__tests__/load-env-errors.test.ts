import { describe, expect, it, jest } from "@jest/globals";

import { createExpectInvalidAuthEnv } from "../../../test/utils/expectInvalidAuthEnv";
import { withEnv } from "../../../test/utils/withEnv";

import { NEXT_SECRET, SESSION_SECRET } from "./authEnvTestUtils";

const expectInvalidAuth = createExpectInvalidAuthEnv(withEnv);

describe("loadAuthEnv errors", () => {
  it("logs and throws on malformed env", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidAuth({
        env: {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
        },
        accessor: (auth) => auth.loadAuthEnv({ NODE_ENV: "production" } as any),
        consoleErrorSpy: spy,
      });
      const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(errorObj).toHaveProperty("NEXTAUTH_SECRET");
      expect(errorObj).toHaveProperty("SESSION_SECRET");
    } finally {
      spy.mockRestore();
    }
  });
});
