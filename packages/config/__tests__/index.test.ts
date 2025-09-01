import { expect } from "@jest/globals";

// Ensure the package's root entry re-exports the compiled core env
// without throwing "Module not found" for missing compiled files.
describe("config package entry", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
  });

  it("re-exports core env from root index", async () => {
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
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv;

    const { env } = await import("../src/index");
    expect({
      STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      CART_COOKIE_SECRET: env.CART_COOKIE_SECRET,
      STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
      NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
      SESSION_SECRET: env.SESSION_SECRET,
    }).toEqual({
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      CART_COOKIE_SECRET: "secret",
      STRIPE_WEBHOOK_SECRET: "whsec",
      NEXTAUTH_SECRET: "nextauth",
      SESSION_SECRET: "session",
    });
  });
});
