import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";

describe("invalid EMAIL_PROVIDER", () => {
  const original = process.env.EMAIL_PROVIDER;

  beforeAll(() => {
    process.env.EMAIL_PROVIDER = "noop";
  });

  afterAll(() => {
    jest.resetModules();
    if (original === undefined) delete process.env.EMAIL_PROVIDER;
    else process.env.EMAIL_PROVIDER = original;
  });

  it("does not throw when importing send", async () => {
    await expect(import("../send")).resolves.toBeDefined();
  });
});
