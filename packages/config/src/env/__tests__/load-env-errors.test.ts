import { describe, it, expect, jest } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";
import { NEXT_SECRET, SESSION_SECRET } from "./authEnvTestUtils";

describe("loadAuthEnv errors", () => {
  it("logs and throws on malformed env", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { loadAuthEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
      },
      () => import("../auth"),
    );
    expect(() =>
      loadAuthEnv({ NODE_ENV: "production" } as any),
    ).toThrow("Invalid auth environment variables");
    const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
    expect(errorObj).toHaveProperty("NEXTAUTH_SECRET");
    expect(errorObj).toHaveProperty("SESSION_SECRET");
    spy.mockRestore();
  });
});
