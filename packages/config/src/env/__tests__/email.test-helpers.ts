import { jest } from "@jest/globals";

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
  process.env = {
    ...baseEnv,
    ...overrides,
  } as NodeJS.ProcessEnv;
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
