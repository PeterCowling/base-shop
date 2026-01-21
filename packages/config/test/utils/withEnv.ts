const ALWAYS_PRESERVE_KEYS = new Set([
  "HOME",
  "PATH",
  "PWD",
  "OLDPWD",
  "SHELL",
  "TERM",
  "TZ",
  "TMP",
  "TMPDIR",
  "TEMP",
  "SHLVL",
  "HOSTNAME",
  "CI",
  "USER",
  "USERNAME",
  "LOGNAME",
  "INIT_CWD",
  "NODE_ENV",
  "NODE_OPTIONS",
  "NODE_NO_WARNINGS",
  "NODE_EXTRA_CA_CERTS",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "no_proxy",
  "SSL_CERT_FILE",
  "REQUESTS_CA_BUNDLE",
  "PIP_CERT",
  "PIPX_BIN_DIR",
  "CODEX_PROXY_CERT",
  "GOROOT",
  "GOBIN",
  "JAVA_HOME",
  "COMPOSER_HOME",
  "PYENV_ROOT",
  "PYENV_SHELL",
  "YARN_HTTP_PROXY",
  "YARN_HTTPS_PROXY",
  "COLUMNS",
  "ROWS",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "UV_NO_PROGRESS",
  "MISE_SHELL",
  "COREPACK_DEFAULT_TO_LATEST",
  "COREPACK_ENABLE_AUTO_PIN",
  "COREPACK_ENABLE_DOWNLOAD_PROMPT",
  "COREPACK_ENABLE_STRICT",
  "DEBIAN_FRONTEND",
  "ELECTRON_GET_USE_PROXY",
  "NVM_BIN",
  "NVM_DIR",
  "NVM_INC",
  "NVM_CD_FLAGS",
  "LS_COLORS",
  "CODEX_ENV_BUN_VERSION",
  "CODEX_ENV_GO_VERSION",
  "CODEX_ENV_JAVA_VERSION",
  "CODEX_ENV_NODE_VERSION",
  "CODEX_ENV_PYTHON_VERSION",
  "CODEX_ENV_RUBY_VERSION",
  "CODEX_ENV_RUST_VERSION",
  "CODEX_ENV_SWIFT_VERSION",
  "__MISE_DIFF",
  "__MISE_ORIG_PATH",
  "__MISE_SESSION",
  "_",
  "PNPM_HOME",
]);

const ALWAYS_PRESERVE_PREFIXES = [
  "npm_",
  "NPM_",
  "pnpm_",
  "PNPM_",
  "YARN_",
  "CODEX_",
  "__MISE_",
];

/**
 * Keys that are automatically carried over from the real process.env unless
 * explicitly overridden in the `vars` parameter.
 *
 * IMPORTANT: When testing scenarios where these variables should be "missing"
 * (e.g., testing development defaults), you MUST explicitly set them to
 * `undefined` in your `vars` object:
 *
 * @example
 * ```typescript
 * // WRONG - SANITY vars will be carried over from real env
 * await withEnv({ NODE_ENV: "development" }, async () => { ... });
 *
 * // CORRECT - explicitly unset carry-over keys
 * await withEnv({
 *   NODE_ENV: "development",
 *   SANITY_PROJECT_ID: undefined,
 *   SANITY_DATASET: undefined,
 *   SANITY_API_TOKEN: undefined,
 *   SANITY_PREVIEW_SECRET: undefined,
 * }, async () => { ... });
 *
 * // OR use the helper from test/fixtures/productionEnv.ts
 * import { withoutCarryOverKeys } from "../fixtures/productionEnv";
 * await withEnv(withoutCarryOverKeys({ NODE_ENV: "development" }), ...);
 * ```
 */
const CARRY_OVER_KEYS = [
  "SANITY_PROJECT_ID",
  "SANITY_DATASET",
  "SANITY_API_TOKEN",
  "SANITY_PREVIEW_SECRET",
];

const NON_STRING_ENV_SYMBOL = Symbol.for("acme.config.nonStringEnv");

function shouldPreserveEnvKey(key: string): boolean {
  if (ALWAYS_PRESERVE_KEYS.has(key)) {
    return true;
  }
  for (const prefix of ALWAYS_PRESERVE_PREFIXES) {
    if (key.startsWith(prefix)) {
      return true;
    }
  }
  return key.toUpperCase() !== key;
}

export async function withEnv<T>(
  vars: Record<string, string | undefined>,
  loader: () => Promise<T>,
): Promise<T> {
  const originalEnv = process.env;

  const preservedEnv = {} as NodeJS.ProcessEnv;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (!shouldPreserveEnvKey(key)) {
      continue;
    }
    if (typeof value === "string") {
      preservedEnv[key] = value;
    }
  }

  const nextEnv: NodeJS.ProcessEnv = { ...preservedEnv };
  // Capture explicit overrides including keys set to undefined
  const overrideKeys = new Set(Object.getOwnPropertyNames(vars));
  const hasEmailFromOverride = Object.prototype.hasOwnProperty.call(
    vars,
    "EMAIL_FROM",
  );
  for (const key of CARRY_OVER_KEYS) {
    if (overrideKeys.has(key)) {
      continue;
    }
    const value = originalEnv[key];
    if (typeof value === "string") {
      nextEnv[key] = value;
    }
  }
  const nonStringKeys: string[] = [];
  for (const [key, value] of Object.entries(vars)) {
    if (typeof value === "undefined") {
      delete nextEnv[key];
    } else {
      nextEnv[key] = value;
      if (typeof value !== "string") {
        nonStringKeys.push(key);
      }
    }
  }

  if (nonStringKeys.length > 0) {
    const nextEnvSymbols = nextEnv as unknown as Record<symbol, unknown>;
    nextEnvSymbols[NON_STRING_ENV_SYMBOL] = nonStringKeys;
    (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__ =
      nonStringKeys.slice();
  } else {
    delete (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
  }

  if (!hasEmailFromOverride && typeof nextEnv.EMAIL_FROM !== "string") {
    const fallbackFrom = originalEnv.EMAIL_FROM ?? "test@example.com";
    if (typeof fallbackFrom === "string" && fallbackFrom.length > 0) {
      nextEnv.EMAIL_FROM = fallbackFrom;
    }
  }

  jest.resetModules();
  process.env = nextEnv;

  // Ensure explicit unset overrides are honored for EMAIL_FROM
  if (hasEmailFromOverride && typeof vars.EMAIL_FROM === "undefined") {
    delete (process.env as Record<string, unknown>)["EMAIL_FROM"];
  }

  if (!("NODE_ENV" in vars)) {
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
  }

  try {
    let result!: T;
    const isolateModulesAsync = (
      jest as unknown as {
        isolateModulesAsync?: (fn: () => Promise<void>) => Promise<void>;
      }
    ).isolateModulesAsync;
    if (typeof isolateModulesAsync === "function") {
      await isolateModulesAsync(async () => {
        result = await loader();
      });
    } else {
      await new Promise<void>((resolve, reject) => {
        jest.isolateModules(() => {
          Promise.resolve()
            .then(async () => {
              result = await loader();
            })
            .then(() => resolve())
            .catch(reject);
        });
      });
    }
    return result;
  } finally {
    const processEnvSymbols = process.env as unknown as Record<symbol, unknown>;
    delete processEnvSymbols[NON_STRING_ENV_SYMBOL];
    delete (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
    process.env = originalEnv;
  }
}
