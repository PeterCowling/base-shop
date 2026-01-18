import { expect, jest } from "@jest/globals";

import { withEnv as configWithEnv } from "./withEnv";

type EnvOverrides = Record<string, string | undefined>;

type WithEnvExecutor<TEnv extends EnvOverrides> = <T>(
  env: TEnv,
  fn: () => Promise<T>,
) => Promise<T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Jest SpyInstance types vary between @jest/globals and @types/jest
type AnySpyInstance = { mockRestore: () => void } & Record<string, any>;

export interface ExpectInvalidAuthEnvOptions<TEnv extends EnvOverrides> {
  env: TEnv;
  accessor: (
    authModule: Awaited<typeof import("@acme/config/env/auth")>,
  ) => unknown | Promise<unknown>;
  withEnv: WithEnvExecutor<TEnv>;
  consoleErrorSpy?: AnySpyInstance;
  expectedMessage?: string;
}

async function runAccessor(
  accessor: (
    authModule: Awaited<typeof import("@acme/config/env/auth")>,
  ) => unknown | Promise<unknown>,
): Promise<void> {
  jest.resetModules();
  if (typeof jest.isolateModulesAsync === "function") {
    await jest.isolateModulesAsync(async () => {
      const authModule = await import("@acme/config/env/auth");
      await accessor(authModule);
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    jest.isolateModules(() => {
      Promise.resolve()
        .then(() => import("@acme/config/env/auth"))
        .then((authModule) => accessor(authModule))
        .then(() => resolve())
        .catch(reject);
    });
  });
}

export async function expectInvalidAuthEnv<TEnv extends EnvOverrides>(
  options: ExpectInvalidAuthEnvOptions<TEnv>,
): Promise<void> {
  const {
    env,
    accessor,
    withEnv,
    consoleErrorSpy,
    expectedMessage = "Invalid auth environment variables",
  } = options;

  const spy =
    consoleErrorSpy ?? jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    await withEnv(env, async () => {
      const prevSkip =
        (globalThis as Record<string, unknown>).__ACME_SKIP_EAGER_AUTH_ENV__;
      (globalThis as Record<string, unknown>).__ACME_SKIP_EAGER_AUTH_ENV__ = true;

      const invokeAccessor = async () => {
        try {
          await runAccessor(accessor);
        } finally {
          if (typeof prevSkip === "undefined") {
            delete (globalThis as Record<string, unknown>).__ACME_SKIP_EAGER_AUTH_ENV__;
          } else {
            (globalThis as Record<string, unknown>).__ACME_SKIP_EAGER_AUTH_ENV__ =
              prevSkip;
          }
        }
      };

      await expect(invokeAccessor()).rejects.toThrow(expectedMessage);
    });
  } finally {
    if (!consoleErrorSpy) {
      spy.mockRestore();
    }
  }
}

export function createExpectInvalidAuthEnv<TEnv extends EnvOverrides>(
  withEnvImpl: WithEnvExecutor<TEnv>,
): (
  options: Omit<ExpectInvalidAuthEnvOptions<TEnv>, "withEnv">,
) => Promise<void> {
  return (options) => expectInvalidAuthEnv({ ...options, withEnv: withEnvImpl });
}

export const expectInvalidAuthEnvWithConfigEnv =
  createExpectInvalidAuthEnv(configWithEnv);
