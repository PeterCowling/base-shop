import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";

describe("invalid EMAIL_PROVIDER", () => {
  const original = process.env.EMAIL_PROVIDER;

  beforeAll(() => {
    process.env.EMAIL_PROVIDER = "invalid";
  });

  afterAll(() => {
    jest.resetModules();
    if (original === undefined) delete process.env.EMAIL_PROVIDER;
    else process.env.EMAIL_PROVIDER = original;
  });

  it("throws when importing send", async () => {
    await expect(import("../send")).rejects.toThrow(
      "Unsupported EMAIL_PROVIDER"
    );
  });
});
