import { loadCoreEnv } from "./loader.parse.js";
import type { CoreEnv } from "./schema.core.js";

export type LoadCoreEnvFn = (raw?: NodeJS.ProcessEnv) => CoreEnv;

let __loadCoreEnvFn: LoadCoreEnvFn | null = null;
const cachedEnvMode = process.env.NODE_ENV;

function extractLoadCoreEnvFn(candidate: unknown): LoadCoreEnvFn | null {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === "function") {
    return candidate as LoadCoreEnvFn;
  }

  if (
    typeof (candidate as { loadCoreEnv?: unknown }).loadCoreEnv === "function"
  ) {
    return (candidate as { loadCoreEnv: LoadCoreEnvFn }).loadCoreEnv;
  }

  const defaultExport = (candidate as { default?: unknown }).default;
  if (
    defaultExport &&
    typeof (defaultExport as { loadCoreEnv?: unknown }).loadCoreEnv ===
      "function"
  ) {
    return (defaultExport as { loadCoreEnv: LoadCoreEnvFn }).loadCoreEnv;
  }

  return null;
}

export function resolveLoadCoreEnvFn(): LoadCoreEnvFn {
  if (__loadCoreEnvFn) {
    return __loadCoreEnvFn;
  }

  const shouldPreferStub =
    cachedEnvMode === "production" || cachedEnvMode == null;

  if (shouldPreferStub) {
    try {
      // Use direct require with a static string so bundlers can statically analyze.
      // This avoids critical dependency warnings from aliasing/indirect require calls.
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- ENG-1234 require to aid static analysis in prod
      const mod = require("../core.js");
      const loader = extractLoadCoreEnvFn(mod);
      if (loader) {
        __loadCoreEnvFn = loader;
        return __loadCoreEnvFn;
      }
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? (error as { code?: unknown }).code
          : undefined;
      if (
        code !== "MODULE_NOT_FOUND" &&
        code !== "ERR_MODULE_NOT_FOUND" &&
        code !== "ERR_REQUIRE_ESM" &&
        code !== "ERR_UNKNOWN_FILE_EXTENSION"
      ) {
        throw error;
      }
    }
  }

  __loadCoreEnvFn = loadCoreEnv;
  return __loadCoreEnvFn as LoadCoreEnvFn;
}
