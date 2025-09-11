/** @jest-environment node */
import { jest } from "@jest/globals";

export async function withEnv(
  vars: Record<string, string | undefined>,
  run: () => Promise<void> | void,
): Promise<void> {
  const originalEnv = { ...process.env };

  try {
    process.env = { ...originalEnv, EMAIL_FROM: "from@example.com" };
    for (const [key, value] of Object.entries(vars)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    jest.resetModules();
    await jest.isolateModulesAsync(async () => {
      await run();
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

