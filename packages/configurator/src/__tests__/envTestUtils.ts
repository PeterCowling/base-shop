/** @jest-environment node */

export async function withEnv<T>(
  vars: Record<string, string | undefined>,
  loader: () => Promise<T>,
): Promise<T> {
  const originalEnv = process.env;
  process.env = { ...originalEnv };

  try {
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    jest.resetModules();

    return await new Promise<T>((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const result = await loader();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  } finally {
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
