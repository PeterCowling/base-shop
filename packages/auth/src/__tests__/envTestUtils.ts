/** @jest-environment node */

const NON_STRING_ENV_SYMBOL = Symbol.for("acme.config.nonStringEnv");

function updateNonStringMetadata(
  env: NodeJS.ProcessEnv,
  tracked: Set<string>,
): void {
  if (tracked.size > 0) {
    const list = Array.from(tracked);
    (env as unknown as Record<symbol, unknown>)[NON_STRING_ENV_SYMBOL] = list;
    (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__ = list.slice();
    if (list.includes("AUTH_TOKEN_TTL")) {
      (globalThis as Record<string, unknown>).__ACME_ALLOW_NUMERIC_TTL__ = true;
    }
  } else {
    delete (env as unknown as Record<symbol, unknown>)[NON_STRING_ENV_SYMBOL];
    delete (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
    delete (globalThis as Record<string, unknown>).__ACME_ALLOW_NUMERIC_TTL__;
  }
}

function installNonStringTracker(
  env: NodeJS.ProcessEnv,
  keysToTrack: string[],
  tracked: Set<string>,
  update: () => void,
): () => void {
  const restores: Array<() => void> = [];

  for (const key of keysToTrack) {
    const descriptor = Object.getOwnPropertyDescriptor(env, key);
    if (descriptor && descriptor.configurable === false) {
      continue;
    }

    let currentValue = (env as Record<string, unknown>)[key];
    if (typeof currentValue !== "string" && typeof currentValue !== "undefined") {
      tracked.add(key);
    }

    restores.push(() => {
      if (descriptor) {
        Object.defineProperty(env, key, descriptor);
      } else {
        delete env[key as keyof NodeJS.ProcessEnv];
      }
    });

    Object.defineProperty(env, key, {
      configurable: true,
      enumerable: true,
      get() {
        return currentValue;
      },
      set(value: unknown) {
        currentValue = value as any;
        if (typeof value !== "string" && typeof value !== "undefined") {
          tracked.add(key);
        } else {
          tracked.delete(key);
        }
        update();
      },
    });
  }

  update();

  return () => {
    for (const restore of restores.reverse()) {
      restore();
    }
    update();
  };
}

export async function withEnv(
  vars: Record<string, string | number | undefined>,
  fn: () => Promise<unknown> | unknown,
): Promise<void> {
  const originalEnv = process.env;
  const originalSnapshot = { ...process.env };

  const nextEnv: NodeJS.ProcessEnv = Object.assign(
    Object.create(null),
    originalSnapshot,
    { EMAIL_FROM: "from@example.com" },
  );

  const tracked = new Set<string>();

  for (const [key, value] of Object.entries(vars)) {
    if (typeof value === "undefined") {
      delete nextEnv[key];
    } else {
      nextEnv[key] = value as any;
      if (typeof value !== "string") {
        tracked.add(key);
      }
    }
  }

  jest.resetModules();
  process.env = nextEnv;

  const update = () => updateNonStringMetadata(process.env, tracked);
  const restoreTracker = installNonStringTracker(
    process.env,
    ["AUTH_TOKEN_TTL"],
    tracked,
    update,
  );

  const runIsolated = async () => {
    if (typeof jest.isolateModulesAsync === "function") {
      await jest.isolateModulesAsync(async () => {
        await fn();
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(() => {
        Promise.resolve()
          .then(fn)
          .then(() => resolve())
          .catch(reject);
      });
    });
  };

  try {
    await runIsolated();
  } finally {
    restoreTracker();
    const restoreEnv: NodeJS.ProcessEnv = Object.assign(
      Object.create(null),
      originalSnapshot,
    );
    delete (restoreEnv as unknown as Record<symbol, unknown>)[NON_STRING_ENV_SYMBOL];
    delete (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
    process.env = restoreEnv;
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
