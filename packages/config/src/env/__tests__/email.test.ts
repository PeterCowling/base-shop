import { afterEach, describe, expect, it } from "@jest/globals";

describe("email env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("logs formatted errors and throws on invalid configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      EMAIL_PROVIDER: "invalid" as unknown as NodeJS.ProcessEnv[string],
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../email.ts")).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        EMAIL_PROVIDER: {
          _errors: [expect.stringContaining("Invalid enum value")],
        },
      }),
    );
    errorSpy.mockRestore();
  });
});
