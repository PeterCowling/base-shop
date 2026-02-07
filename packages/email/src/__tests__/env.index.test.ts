import { afterEach,describe, expect, it } from "@jest/globals";

import { withEnv } from "../../../config/test/utils/withEnv";

describe("env index", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws for invalid deposit release config", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { DEPOSIT_RELEASE_ENABLED: "maybe" },
        () => import("@acme/config/env"),
      ),
    ).rejects.toThrow("Invalid environment variables");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("loads env when deposit release config is valid", async () => {
    const mod = await withEnv(
      {
        DEPOSIT_RELEASE_ENABLED: "true",
        DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      },
      () => import("@acme/config/env"),
    );
    expect(mod.env.DEPOSIT_RELEASE_ENABLED).toBe(true);
    expect(mod.env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
  });
});

