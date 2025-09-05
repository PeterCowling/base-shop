/** @jest-environment node */

export async function withEnv<T>(
  vars: Record<string, string | undefined>,
  fn: () => Promise<T> | T,
  options: { useFakeTimers?: boolean } = {},
): Promise<T> {
  const originalEnv = process.env;
  process.env = { ...originalEnv };
  const { useFakeTimers = false } = options;

  try {
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    if (useFakeTimers) {
      jest.useFakeTimers();
    }

    jest.resetModules();

    return await new Promise<T>((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  } finally {
    if (useFakeTimers) {
      jest.useRealTimers();
    }
    process.env = originalEnv;
  }
}

export async function importFresh<T = unknown>(path: string): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    jest.isolateModules(async () => {
      try {
        const mod = (await import(path)) as T;
        resolve(mod);
      } catch (err) {
        reject(err);
      }
    });
  });
}
