import { jest } from "@jest/globals";
import type { ShippingEnv } from "../shipping.ts";

const BASE_ENV: NodeJS.ProcessEnv = { ...process.env };

const clone = (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv => ({
  ...env,
});

const mergeEnv = (overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => {
  const merged: NodeJS.ProcessEnv = clone(BASE_ENV);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete merged[key];
      continue;
    }
    merged[key] = value as any;
  }
  return merged;
};

export const resetShippingEnv = (): void => {
  process.env = clone(BASE_ENV);
  jest.resetModules();
};

export const setShippingEnv = (overrides: NodeJS.ProcessEnv = {}): void => {
  process.env = mergeEnv(overrides);
  jest.resetModules();
};

type ShippingLoader = (raw?: NodeJS.ProcessEnv) => ShippingEnv;

export const withShippingEnv = async <T>(
  overrides: NodeJS.ProcessEnv,
  run: (load: () => ShippingEnv) => T | Promise<T>,
): Promise<T> => {
  jest.resetModules();
  const loadShippingEnv = await loadShippingEnvFn();
  return run(() => loadShippingEnv(overrides));
};

const loadShippingEnvFn = async (): Promise<ShippingLoader> => {
  const { loadShippingEnv } = await import("../shipping.ts");
  return loadShippingEnv;
};

export const importShippingModule = async () => {
  jest.resetModules();
  return import("../shipping.ts");
};

export const loadShippingEnvDirect = async (overrides?: NodeJS.ProcessEnv) => {
  jest.resetModules();
  const load = await loadShippingEnvFn();
  return load(overrides);
};

export const spyOnConsoleError = () =>
  jest.spyOn(console, "error").mockImplementation(() => {});
