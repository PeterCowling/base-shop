/** @jest-environment node */
import { jest } from "@jest/globals";

export async function withEnv(
  vars: Record<string, string | undefined>,
  run: () => Promise<void> | void,
): Promise<void> {
  const originalEnv = { ...process.env };
  const sanitizedKeys = new Set([
    "CART_COOKIE_SECRET",
    "EMAIL_PROVIDER",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "LOGIN_RATE_LIMIT_REDIS_URL",
    "LOGIN_RATE_LIMIT_REDIS_TOKEN",
    "JWT_SECRET",
    "OAUTH_ISSUER",
    "OAUTH_CLIENT_ID",
    "OAUTH_CLIENT_SECRET",
    "OAUTH_REDIRECT_ORIGIN",
    "OAUTH_ENFORCE_PKCE",
    "EMAIL_FROM",
    "CAMPAIGN_FROM",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SENDGRID_API_KEY",
    "RESEND_API_KEY",
  ] satisfies Array<keyof NodeJS.ProcessEnv>);

  try {
    process.env = { ...originalEnv, EMAIL_FROM: "from@example.com" };
    for (const key of sanitizedKeys) {
      if (!(key in vars)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(vars)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    if (!("EMAIL_FROM" in vars) && typeof process.env.EMAIL_FROM !== "string") {
      process.env.EMAIL_FROM = "from@example.com";
    }

    jest.resetModules();
    let result: unknown;
    await jest.isolateModulesAsync(async () => {
      result = await run();

      const loadFns = new Set<() => unknown | Promise<unknown>>();

      const collectLoaders = (candidate: unknown) => {
        if (typeof candidate === "function") {
          if (/^load[A-Z].*Env$/.test(candidate.name ?? "")) {
            loadFns.add(candidate as () => unknown | Promise<unknown>);
          }
          return;
        }
        if (!candidate || typeof candidate !== "object") {
          return;
        }
        for (const [key, value] of Object.entries(
          candidate as Record<string, unknown>,
        )) {
          if (
            typeof value === "function" &&
            /^load[A-Z].*Env$/.test(key)
          ) {
            loadFns.add(value as () => unknown | Promise<unknown>);
          }
        }
      };

      collectLoaders(result);
      if (
        result &&
        typeof result === "object" &&
        "default" in (result as Record<string, unknown>)
      ) {
        collectLoaders(
          (result as Record<string, unknown>).default,
        );
      }

      const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
        return (
          typeof value === "object" &&
          value !== null &&
          "then" in value &&
          typeof (value as { then?: unknown }).then === "function"
        );
      };

      for (const loader of loadFns) {
        const maybeResult = loader();
        if (isPromiseLike(maybeResult)) {
          await maybeResult;
        }
      }
    });
  } finally {
    process.env = originalEnv;
  }
}

export async function importEnv<T = unknown>(modulePath: string): Promise<T> {
  let mod!: T;
  await jest.isolateModulesAsync(async () => {
    mod = (await import(modulePath)) as T;
  });
  return mod;
}
