/** @jest-environment node */

const PRESERVED_ENV_KEYS = new Set([
  "CI",
  "COLORTERM",
  "FORCE_COLOR",
  "GITHUB_ACTION",
  "GITHUB_ACTION_REF",
  "GITHUB_ACTION_REPOSITORY",
  "GITHUB_ACTIONS",
  "GITHUB_ACTOR",
  "GITHUB_BASE_REF",
  "GITHUB_ENV",
  "GITHUB_EVENT_NAME",
  "GITHUB_EVENT_PATH",
  "GITHUB_HEAD_REF",
  "GITHUB_JOB",
  "GITHUB_PATH",
  "GITHUB_REF",
  "GITHUB_REF_NAME",
  "GITHUB_REF_PROTECTED",
  "GITHUB_REF_TYPE",
  "GITHUB_REPOSITORY",
  "GITHUB_RUN_ATTEMPT",
  "GITHUB_RUN_ID",
  "GITHUB_RUN_NUMBER",
  "GITHUB_SERVER_URL",
  "GITHUB_SHA",
  "GITHUB_STEP_SUMMARY",
  "GITHUB_TRIGGERING_ACTOR",
  "GITHUB_WORKFLOW",
  "GITHUB_WORKSPACE",
  "HOME",
  "HOSTNAME",
  "JEST_WORKER_ID",
  "LANG",
  "LC_ALL",
  "LOGNAME",
  "NODE_ENV",
  "NODE_OPTIONS",
  "NODE_PATH",
  "OLDPWD",
  "PATH",
  "PNPM_HOME",
  "PWD",
  "SHELL",
  "SHLVL",
  "TERM",
  "TERM_PROGRAM",
  "TMP",
  "TMPDIR",
  "TZ",
  "USER",
]);

const PRESERVED_ENV_PREFIXES = [
  "npm_",
  "NPM_",
  "pnpm_",
  "PNPM_",
  "YARN_",
];

const shouldPreserveEnvKey = (key: string): boolean =>
  PRESERVED_ENV_KEYS.has(key) ||
  PRESERVED_ENV_PREFIXES.some((prefix) => key.startsWith(prefix));

const NON_STRING_ENV_SYMBOL = Symbol.for("acme.config.nonStringEnv");

export async function withEnv<T>(
  vars: Record<string, string | undefined>,
  loader: () => Promise<T>,
): Promise<T> {
  const originalEntries = Object.entries(process.env);
  const originalEnv = new Map<string, string | undefined>(originalEntries);

  const preservedEnv = Object.create(null) as NodeJS.ProcessEnv;
  for (const [key, value] of originalEnv.entries()) {
    if (value !== undefined && shouldPreserveEnvKey(key)) {
      preservedEnv[key] = value;
    }
  }

  const nextEnv = Object.create(null) as NodeJS.ProcessEnv;
  Object.assign(nextEnv, preservedEnv);

  const nonStringKeys: string[] = [];
  for (const [key, value] of Object.entries(vars)) {
    if (typeof value === "undefined") {
      delete nextEnv[key];
      continue;
    }
    nextEnv[key] = value;
    if (typeof value !== "string") {
      nonStringKeys.push(key);
    }
  }

  if (nonStringKeys.length > 0) {
    (nextEnv as Record<symbol, unknown>)[NON_STRING_ENV_SYMBOL] = nonStringKeys;
    (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__ =
      nonStringKeys.slice();
  } else {
    delete (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
  }

  jest.resetModules();
  process.env = nextEnv;

  if (!Object.prototype.hasOwnProperty.call(vars, "NODE_ENV")) {
    delete process.env.NODE_ENV;
  }

  try {
    const result = await new Promise<T>((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const result = await loader();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });

    if (
      result &&
      typeof result === "object" &&
      "authEnv" in (result as Record<string, unknown>)
    ) {
      const authEnv = (result as Record<string, unknown>).authEnv as {
        AUTH_PROVIDER?: unknown;
      };
      // Touch authEnv so it snapshots while overrides are active.
      void authEnv?.AUTH_PROVIDER;
    }

    return result;
  } finally {
    delete (process.env as Record<symbol, unknown>)[NON_STRING_ENV_SYMBOL];
    delete (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;

    const restoredEnv = Object.create(null) as NodeJS.ProcessEnv;
    for (const [key, value] of originalEnv.entries()) {
      if (value !== undefined) {
        restoredEnv[key] = value;
      }
    }
    process.env = restoredEnv;
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
