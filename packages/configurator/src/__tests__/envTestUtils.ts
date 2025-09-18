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

export async function withEnv<T>(
  vars: Record<string, string | undefined>,
  loader: () => Promise<T>,
): Promise<T> {
  const originalEnv = process.env;
  const sandboxEnv: NodeJS.ProcessEnv = {} as NodeJS.ProcessEnv;

  for (const [key, value] of Object.entries(originalEnv)) {
    if (value !== undefined && shouldPreserveEnvKey(key)) {
      sandboxEnv[key] = value;
    }
  }

  process.env = sandboxEnv;

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
