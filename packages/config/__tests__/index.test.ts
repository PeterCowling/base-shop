import { expect } from "@jest/globals";

import { withEnv } from "../test/utils/withEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";

// Ensure the package's root entry re-exports the compiled core env
// without throwing "Module not found" for missing compiled files.
describe("config package entry", () => {
  it("re-exports core env from root index", async () => {
    await withEnv(
      {
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        CART_COOKIE_SECRET: "secret",
        STRIPE_WEBHOOK_SECRET: "whsec",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET: SESSION_SECRET,
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2023-01-01",
        SANITY_PROJECT_ID: "test-project",
        SANITY_DATASET: "production",
        SANITY_API_TOKEN: "test-token",
        SANITY_PREVIEW_SECRET: "preview-secret",
        NODE_ENV: "production",
        EMAIL_FROM: "from@example.com",
      },
      async () => {
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
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: SESSION_SECRET,
        });
      },
    );
  });
});
