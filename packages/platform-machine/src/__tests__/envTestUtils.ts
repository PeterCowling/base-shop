/** @jest-environment node */

import { jest } from "@jest/globals";

export async function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => Promise<void> | void
): Promise<void> {
  const originalEnv = process.env;
  process.env = { ...originalEnv };

  try {
    for (const [key, value] of Object.entries(vars)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    jest.resetModules();

    await (jest as any).isolateModulesAsync(async () => {
      await fn();
    });
  } finally {
    process.env = originalEnv;
  }
}

export async function importFresh<T>(path: string): Promise<T> {
  let mod!: T;
  await (jest as any).isolateModulesAsync(async () => {
    mod = (await import(path)) as T;
  });
  return mod;
}
