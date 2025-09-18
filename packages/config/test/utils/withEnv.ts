type EnvValue = string | number | boolean | undefined;
type EnvOverrides = Record<string, EnvValue>;

const globalWithBaseEnv = globalThis as typeof globalThis & {
  __ACME_TEST_BASE_ENV__?: Record<string, string>;
};

const cloneBaseEnv = (): NodeJS.ProcessEnv => {
  const baseline = globalWithBaseEnv.__ACME_TEST_BASE_ENV__;
  if (baseline) {
    return { ...baseline } as NodeJS.ProcessEnv;
  }
  return { ...process.env };
};

const applyOverrides = (
  baseEnv: NodeJS.ProcessEnv,
  overrides: EnvOverrides,
): NodeJS.ProcessEnv => {
  const nextEnv: NodeJS.ProcessEnv = { ...baseEnv };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete nextEnv[key];
      continue;
    }
    nextEnv[key] = typeof value === "string" ? value : String(value);
  }
  return nextEnv;
};

export async function withEnv<T>(
  vars: EnvOverrides,
  loader: () => Promise<T>,
): Promise<T> {
  const previousEnv = process.env;
  const baseEnv = cloneBaseEnv();
  const nextEnv = applyOverrides(baseEnv, vars);
  if (!("NODE_ENV" in vars)) {
    delete nextEnv.NODE_ENV;
  }
  jest.resetModules();
  process.env = nextEnv;
  try {
    return await loader();
  } finally {
    process.env = previousEnv;
  }
}
