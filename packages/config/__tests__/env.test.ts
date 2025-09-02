import { expect } from "@jest/globals";

describe("env", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("loads valid configuration when all variables are set", async () => {
    process.env = {
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "nextauth",
      SESSION_SECRET: "session",
      CART_COOKIE_SECRET: "cartsecret",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2023-01-01",
      EMAIL_PROVIDER: "sendgrid",
      SENDGRID_API_KEY: "sg-key",
      STRIPE_SECRET_KEY: "sk_live",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live",
      STRIPE_WEBHOOK_SECRET: "whsec_live",
    } as NodeJS.ProcessEnv;

    const { env } = await import("../src/env");

    expect(env).toEqual(
      expect.objectContaining({
        NEXTAUTH_SECRET: "nextauth",
        SESSION_SECRET: "session",
        CART_COOKIE_SECRET: "cartsecret",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2023-01-01",
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "sg-key",
        STRIPE_SECRET_KEY: "sk_live",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live",
        STRIPE_WEBHOOK_SECRET: "whsec_live",
      })
    );
  });

  it("uses development defaults when variables are missing", async () => {
    process.env = {
      NODE_ENV: "development",
    } as NodeJS.ProcessEnv;

    const { env } = await import("../src/env");

    expect(env).toEqual(
      expect.objectContaining({
        NEXTAUTH_SECRET: "dev-nextauth-secret",
        SESSION_SECRET: "dev-session-secret",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "placeholder-token",
        SANITY_API_VERSION: "2021-10-21",
        EMAIL_PROVIDER: "smtp",
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      })
    );
  });

  it("throws and logs when invalid variables are provided", async () => {
    process.env = {
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "x",
      SESSION_SECRET: "y",
      CART_COOKIE_SECRET: "z",
      CMS_SPACE_URL: "notaurl",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2023-01-01",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/env")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(spy).toHaveBeenCalled();
  });
});
