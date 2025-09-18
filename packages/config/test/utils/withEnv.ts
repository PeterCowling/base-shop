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
  vars: NodeJS.ProcessEnv,
  loader: () => Promise<T>,
): Promise<T> {
  const originalEnv = process.env;

  const preservedEnv: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(originalEnv)) {
    if (!shouldPreserveEnvKey(key)) {
      continue;
    }
    if (typeof value === "string") {
      preservedEnv[key] = value;
    }
  }

  const nextEnv: NodeJS.ProcessEnv = { ...preservedEnv };
  for (const [key, value] of Object.entries(vars)) {
    if (typeof value === "undefined") {
      delete nextEnv[key];
    } else {
      nextEnv[key] = value;
    }
  }

  jest.resetModules();
  process.env = nextEnv;

  if (!("NODE_ENV" in vars)) {
    delete process.env.NODE_ENV;
  }

  try {
    return await loader();
  } finally {
    process.env = originalEnv;
  }
}
