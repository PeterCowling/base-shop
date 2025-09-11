/** @jest-environment node */

export async function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
): Promise<void> {
  const originalEnv = process.env;
  process.env = { ...originalEnv, EMAIL_FROM: "from@example.com" };

  try {
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    jest.resetModules();

    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          await fn();
          resolve();
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
  let mod: T;

  await new Promise<void>((resolve, reject) => {
    jest.isolateModules(async () => {
      try {
        mod = (await import(path)) as T;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });

  return mod!;
}

