import { expect } from "@jest/globals";

describe("envSchema", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
  });

  it("parses when required variables are present", async () => {
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as NodeJS.ProcessEnv;

    const { envSchema } = await import("../src/env");
    const parsed = envSchema.parse({
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    });
    expect(parsed).toEqual({
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    });
  });

  it("throws when variables are missing", async () => {
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as NodeJS.ProcessEnv;

    const { envSchema } = await import("../src/env");

    const invalid = {
      STRIPE_SECRET_KEY: "sk",
    } as Record<string, string>;

    expect(() => envSchema.parse(invalid)).toThrow();
  });
});
