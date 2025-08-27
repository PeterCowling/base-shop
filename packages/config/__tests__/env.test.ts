import { expect } from "@jest/globals";
import { coreEnvBaseSchema } from "../src/env/core.impl";

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
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2023-01-01",
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
        CMS_SPACE_URL: process.env.CMS_SPACE_URL!,
        CMS_ACCESS_TOKEN: process.env.CMS_ACCESS_TOKEN!,
        SANITY_API_VERSION: process.env.SANITY_API_VERSION!,
      });
      expect(parsed).toEqual({
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        CART_COOKIE_SECRET: "secret",
        STRIPE_WEBHOOK_SECRET: "whsec",
        NEXTAUTH_SECRET: "nextauth",
        SESSION_SECRET: "session",
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2023-01-01",
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
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2023-01-01",
    } as NodeJS.ProcessEnv;

    const { envSchema } = await import("../src/env");

    const invalid = {
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as Record<string, string>;

    expect(() => envSchema.parse(invalid)).toThrow();
  });
});

describe("coreEnvBaseSchema", () => {
  it("parses valid CMS variables", () => {
    const parsed = coreEnvBaseSchema.parse({
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
    });

    expect(parsed).toEqual(
      expect.objectContaining({
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "v1",
      }),
    );
  });

  it("fails to parse invalid CMS variables", () => {
    expect(() =>
      coreEnvBaseSchema.parse({
        CMS_SPACE_URL: "not-a-url",
        CMS_ACCESS_TOKEN: "token",
      }),
    ).toThrow();
  });
});
