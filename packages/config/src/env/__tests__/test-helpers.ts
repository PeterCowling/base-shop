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

