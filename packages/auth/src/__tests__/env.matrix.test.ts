import { describe, expect,it } from "@jest/globals";

import { withEnv } from "../../../config/test/utils/withEnv";

type Envs = {
  paymentsEnv: any;
  emailEnv: any;
  authEnv: any;
  cmsEnv: any;
};

type EnvOverrides = Record<string, string | undefined>;

const scenarios: Array<{
  name: string;
  env: EnvOverrides;
  assert: (envs: Envs) => void;
}> = [
  {
    name: "stripe sandbox, resend email, no redis, preview off",
    env: {
      PAYMENTS_PROVIDER: "stripe",
      PAYMENTS_SANDBOX: "true",
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_test_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_key",
      SESSION_STORE: undefined,
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
      CMS_DRAFTS_ENABLED: undefined,
    },
    assert: ({ paymentsEnv, emailEnv, authEnv, cmsEnv }) => {
      expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(true);
      expect(emailEnv.EMAIL_PROVIDER).toBe("resend");
      expect(authEnv.SESSION_STORE).toBeUndefined();
      expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(false);
    },
  },
  {
    name: "stripe sandbox, resend email, preview on",
    env: {
      PAYMENTS_PROVIDER: "stripe",
      PAYMENTS_SANDBOX: "true",
      STRIPE_SECRET_KEY: "sk_test_456",
      STRIPE_WEBHOOK_SECRET: "whsec_test_456",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_456",
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_key",
      SESSION_STORE: undefined,
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
      CMS_DRAFTS_ENABLED: "true",
    },
    assert: ({ paymentsEnv, emailEnv, authEnv, cmsEnv }) => {
      expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(true);
      expect(emailEnv.EMAIL_PROVIDER).toBe("resend");
      expect(authEnv.SESSION_STORE).toBeUndefined();
      expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(true);
    },
  },
  {
    name: "stripe live, resend email, redis, preview off",
    env: {
      PAYMENTS_PROVIDER: "stripe",
      PAYMENTS_SANDBOX: "false",
      STRIPE_SECRET_KEY: "sk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_key",
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://redis.example.com",
      UPSTASH_REDIS_REST_TOKEN: "strongtokenstrongtokenstrongtoken!!",
      CMS_DRAFTS_ENABLED: undefined,
    },
    assert: ({ paymentsEnv, emailEnv, authEnv, cmsEnv }) => {
      expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(false);
      expect(emailEnv.EMAIL_PROVIDER).toBe("resend");
      expect(authEnv.SESSION_STORE).toBe("redis");
      expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(false);
    },
  },
  {
    name: "stripe live, resend email, redis, preview on",
    env: {
      PAYMENTS_PROVIDER: "stripe",
      PAYMENTS_SANDBOX: "false",
      STRIPE_SECRET_KEY: "sk_live_456",
      STRIPE_WEBHOOK_SECRET: "whsec_live_456",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_456",
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_key",
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://redis.example.com",
      UPSTASH_REDIS_REST_TOKEN: "strongtokenstrongtokenstrongtoken!!",
      CMS_DRAFTS_ENABLED: "true",
    },
    assert: ({ paymentsEnv, emailEnv, authEnv, cmsEnv }) => {
      expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(false);
      expect(emailEnv.EMAIL_PROVIDER).toBe("resend");
      expect(authEnv.SESSION_STORE).toBe("redis");
      expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(true);
    },
  },
];

describe("env matrix scenarios", () => {
  it.each(scenarios)("$name", async ({ env, assert }) => {
    await withEnv(env, async () => {
      const { paymentsEnv } = await import("@acme/config/env/payments");
      const { emailEnv } = await import("@acme/config/env/email");
      const { authEnv } = await import("@acme/config/env/auth");
      const { cmsEnv } = await import("@acme/config/env/cms");

      assert({ paymentsEnv, emailEnv, authEnv, cmsEnv });
    });
  });
});
