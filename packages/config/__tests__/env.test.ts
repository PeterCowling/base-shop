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
        CART_COOKIE_SECRET: "secret",
        STRIPE_WEBHOOK_SECRET: "whsec",
        NEXTAUTH_SECRET: "nextauth",
        SESSION_SECRET: "session",
      } as NodeJS.ProcessEnv;

    const { envSchema } = await import("../src/env");
      const parsed = envSchema.parse({
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        CART_COOKIE_SECRET: process.env.CART_COOKIE_SECRET!,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
        SESSION_SECRET: process.env.SESSION_SECRET!,
      });
      expect(parsed).toEqual({
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        CART_COOKIE_SECRET: "secret",
        STRIPE_WEBHOOK_SECRET: "whsec",
        NEXTAUTH_SECRET: "nextauth",
        SESSION_SECRET: "session",
        EMAIL_PROVIDER: "smtp",
      });
  });

  it("throws when variables are missing", async () => {
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      CART_COOKIE_SECRET: "secret",
      STRIPE_WEBHOOK_SECRET: "whsec",
      NEXTAUTH_SECRET: "nextauth",
      SESSION_SECRET: "session",
    } as NodeJS.ProcessEnv;

    const { envSchema } = await import("../src/env");

    const invalid = {
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as Record<string, string>;

    expect(() => envSchema.parse(invalid)).toThrow();
  });
});
