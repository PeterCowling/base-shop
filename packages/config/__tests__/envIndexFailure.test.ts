import { expect } from "@jest/globals";

import { withEnv } from "../test/utils/withEnv";

describe("env index validation", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws and logs on invalid environment variables", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          DEPOSIT_RELEASE_INTERVAL_MS: "abc",
        },
        () => import("../src/env/index"),
      ),
    ).rejects.toThrow("Invalid environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid environment variables:",
      expect.objectContaining({
        DEPOSIT_RELEASE_INTERVAL_MS: { _errors: ["must be a number"] },
      }),
    );
  });

  it("succeeds with valid environment variables", async () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const mod = await withEnv(
      {
        DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      },
      () => import("../src/env/index"),
    );
    expect(mod.env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

