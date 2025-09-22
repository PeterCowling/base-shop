import { jest } from "@jest/globals";

const NON_STRING_ENV_SYMBOL = Symbol.for("acme.config.nonStringEnv");

const EMAIL_FROM_FALLBACK = "from@example.com";

const baseEnv: NodeJS.ProcessEnv = {
  ...process.env,
  EMAIL_FROM: EMAIL_FROM_FALLBACK,
};

const clone = (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv => ({
  ...env,
});

export const resetEmailEnv = (): void => {
  process.env = clone(baseEnv);
  jest.resetModules();
};

export const setEmailEnv = (overrides: NodeJS.ProcessEnv = {}): void => {
  const next: NodeJS.ProcessEnv = { ...baseEnv, ...overrides } as NodeJS.ProcessEnv;
  const nonStringKeys: string[] = [];
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value !== "undefined" && typeof value !== "string") {
      nonStringKeys.push(key);
    }
  }
  if (nonStringKeys.length > 0) {
    (next as Record<symbol, unknown>)[NON_STRING_ENV_SYMBOL] = nonStringKeys;
    (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__ = nonStringKeys.slice();
  } else {
    delete (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
  }
  process.env = next;
  jest.resetModules();
};

export const withEmailEnv = async <T>(
  overrides: NodeJS.ProcessEnv,
  fn: () => Promise<T> | T,
): Promise<T> => {
  setEmailEnv(overrides);
  try {
    return await fn();
  } finally {
    resetEmailEnv();
  }
};

export const loadEmailEnv = async () => {
  jest.resetModules();
  return (await import("../email.ts")).emailEnv;
};

export const loadEmailEnvSchema = async () => {
  jest.resetModules();
  return (await import("../email.ts")).emailEnvSchema;
};

export const spyOnConsoleError = () =>
  jest.spyOn(console, "error").mockImplementation(() => {});
