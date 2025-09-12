import { describe, it, expect } from "@jest/globals";
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
    expect(spy).toHaveBeenCalled();
  });
});
