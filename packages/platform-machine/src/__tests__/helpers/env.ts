const NON_STRING_ENV_SYMBOL = Symbol.for("acme.config.nonStringEnv");

type EnvLoader<T> = () => Promise<T>;

type MaybeStringRecord = Record<string, string | undefined>;

export async function withEnv<T>(
  overrides: NodeJS.ProcessEnv,
  loader: EnvLoader<T>,
): Promise<T> {
  const originalEnv = process.env;
  const nextEnv: NodeJS.ProcessEnv = {
    ...(originalEnv as MaybeStringRecord),
    EMAIL_FROM:
      typeof originalEnv.EMAIL_FROM === "string"
        ? originalEnv.EMAIL_FROM
        : "from@example.com",
    ...overrides,
  };

  const nonStringKeys: string[] = [];
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === "undefined") {
      delete (nextEnv as Record<string, unknown>)[key];
      continue;
    }
    if (typeof value !== "string") {
      nonStringKeys.push(key);
    }
  }

  if (nonStringKeys.length > 0) {
    (nextEnv as Record<symbol, unknown>)[NON_STRING_ENV_SYMBOL] =
      nonStringKeys.slice();
    (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__ =
      nonStringKeys.slice();
  } else {
    delete (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
  }

  if (!("EMAIL_FROM" in nextEnv) || typeof nextEnv.EMAIL_FROM !== "string") {
    nextEnv.EMAIL_FROM = "from@example.com";
  }

  jest.resetModules();
  process.env = nextEnv;

  try {
    return await loader();
  } finally {
    delete (process.env as Record<symbol, unknown>)[NON_STRING_ENV_SYMBOL];
    delete (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
    process.env = originalEnv;
  }
}
