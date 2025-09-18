import { expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const DEV_NEXT_SECRET = "dev-nextauth-secret-32-chars-long-string!";
const DEV_SESSION_SECRET = "dev-session-secret-32-chars-long-string!";

describe("env", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads valid configuration when all variables are set", async () => {
    const { env } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET: SESSION_SECRET,
        CART_COOKIE_SECRET: "cartsecret",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2023-01-01",
        EMAIL_FROM: "from@example.com",
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "sg-key",
        STRIPE_SECRET_KEY: "sk_live",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live",
        STRIPE_WEBHOOK_SECRET: "whsec_live",
      },
      () => import("../src/env"),
    );

    expect(env).toEqual(
      expect.objectContaining({
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET: SESSION_SECRET,
        CART_COOKIE_SECRET: "cartsecret",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2023-01-01",
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "sg-key",
        STRIPE_SECRET_KEY: "sk_live",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live",
        STRIPE_WEBHOOK_SECRET: "whsec_live",
      }),
    );
  });

  it("uses development defaults when variables are missing", async () => {
    const { env } = await withEnv(
      {
        NODE_ENV: "development",
        NEXTAUTH_SECRET: undefined,
        SESSION_SECRET: undefined,
        CMS_SPACE_URL: undefined,
        CMS_ACCESS_TOKEN: undefined,
        SANITY_API_VERSION: undefined,
        EMAIL_PROVIDER: undefined,
        STRIPE_SECRET_KEY: undefined,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined,
        STRIPE_WEBHOOK_SECRET: undefined,
      },
      () => import("../src/env"),
    );

    expect(env).toEqual(
      expect.objectContaining({
        NEXTAUTH_SECRET: DEV_NEXT_SECRET,
        SESSION_SECRET: DEV_SESSION_SECRET,
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "placeholder-token",
        SANITY_API_VERSION: "2021-10-21",
        SANITY_PROJECT_ID: "dummy-project-id",
        SANITY_DATASET: "production",
        SANITY_API_TOKEN: "dummy-api-token",
        SANITY_PREVIEW_SECRET: "dummy-preview-secret",
        EMAIL_PROVIDER: "smtp",
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
        PAYMENTS_SANDBOX: true,
        PAYMENTS_CURRENCY: "USD",
        AUTH_PROVIDER: "local",
        TOKEN_ALGORITHM: "HS256",
        TOKEN_AUDIENCE: "base-shop",
        TOKEN_ISSUER: "base-shop",
        ALLOW_GUEST: false,
        ENFORCE_2FA: false,
        CMS_PAGINATION_LIMIT: 100,
        CMS_DRAFTS_ENABLED: false,
        CMS_DRAFTS_DISABLED_PATHS: [],
        CMS_SEARCH_ENABLED: false,
        CMS_SEARCH_DISABLED_PATHS: [],
      }),
    );
  });

  it("throws and logs when invalid variables are provided", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: SESSION_SECRET,
          CART_COOKIE_SECRET: "z",
          CMS_SPACE_URL: "notaurl",
          CMS_ACCESS_TOKEN: "token",
          SANITY_API_VERSION: "2023-01-01",
          EMAIL_FROM: "from@example.com",
        },
        () => import("../src/env"),
      ),
    ).rejects.toThrow("Invalid core environment variables");
    expect(spy).toHaveBeenCalled();
  });
});
