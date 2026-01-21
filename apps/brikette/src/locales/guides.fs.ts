// file path: src/locales/guides.fs.ts
// -----------------------------------------------------------------------------
// Node-only filesystem loaders to support environments where import.meta.glob
// is unavailable (e.g. Vitest without Vite context). Kept parallel to
// `src/locales/guides.ts` so relative paths/globs resolve correctly.
// -----------------------------------------------------------------------------

import { createRequire } from "module";
import { fileURLToPath } from "url";

import type {
  GuidesNamespace,
  ModuleOverrides,
  ModuleRecord,
} from "./guides.types";

export function isNodeRuntime(): boolean {
  return typeof process !== "undefined" && Boolean(process?.versions?.node);
}

export async function loadGuidesModuleOverridesFromFs(): Promise<ModuleOverrides | undefined> {
  if (!isNodeRuntime()) return undefined;

  const require = createRequire(import.meta.url);
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");

  const localesRoot = path.dirname(fileURLToPath(import.meta.url));

  const legacyModules: ModuleRecord<GuidesNamespace> = {};
  const splitGlobalModules: ModuleRecord = {};
  const splitContentModules: ModuleRecord = {};

  const readJsonFile = <T = unknown>(filePath: string): T => {
    const data = fs.readFileSync(filePath, "utf8");
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON from ${filePath}: ${(error as Error).message}`);
    }
  };

  const makeKey = (locale: string, relativePath: string): string =>
    `./${locale}/${relativePath}`.replace(/\\/g, "/");

  const entries = fs.readdirSync(localesRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_")) continue;

    const locale = entry.name;
    const localeDir = path.join(localesRoot, locale);

    const legacyFile = path.join(localeDir, "guides.json");
    if (fs.existsSync(legacyFile) && fs.statSync(legacyFile).isFile()) {
      legacyModules[makeKey(locale, "guides.json")] = {
        default: readJsonFile<GuidesNamespace>(legacyFile),
      };
    }

    const guidesDir = path.join(localeDir, "guides");
    if (!fs.existsSync(guidesDir) || !fs.statSync(guidesDir).isDirectory()) {
      continue;
    }

    const stack: Array<{ dir: string; segments: string[] }> = [{ dir: guidesDir, segments: [] }];

    while (stack.length > 0) {
      const { dir, segments } = stack.pop()!;
      const children = fs.readdirSync(dir, { withFileTypes: true });

      for (const child of children) {
        if (child.name.startsWith("_")) continue;
        const nextSegments = [...segments, child.name];
        const absolute = path.join(dir, child.name);

        if (child.isDirectory()) {
          stack.push({ dir: absolute, segments: nextSegments });
          continue;
        }

        if (!child.isFile() || !child.name.endsWith(".json")) {
          continue;
        }

        const relativePath = ["guides", ...nextSegments].join("/");
        const data = readJsonFile(absolute);
        splitGlobalModules[makeKey(locale, relativePath)] = { default: data };

        if (nextSegments[0] === "content" && nextSegments.length === 2) {
          splitContentModules[makeKey(locale, relativePath)] = { default: data };
        }
      }
    }
  }

  return {
    legacy: legacyModules,
    splitGlobal: splitGlobalModules,
    splitContent: splitContentModules,
  } satisfies ModuleOverrides;
}

// Synchronous variant used in Node/Vitest to avoid a race where async
// warming hasn't completed before tests call getGuidesBundle(). Mirrors the
// logic from the async loader but uses sync FS calls only.
export function loadGuidesModuleOverridesFromFsSync(): ModuleOverrides | undefined {
  if (!isNodeRuntime()) return undefined;

  const nodeRequire = createRequire(import.meta.url);
  const fs = nodeRequire("fs") as typeof import("fs");
  const path = nodeRequire("path") as typeof import("path");
  const { fileURLToPath } = nodeRequire("url") as typeof import("url");

  const localesRoot = path.dirname(fileURLToPath(import.meta.url));

  const legacyModules: ModuleRecord<GuidesNamespace> = {};
  const splitGlobalModules: ModuleRecord = {};
  const splitContentModules: ModuleRecord = {};

  const readJsonFile = <T = unknown>(filePath: string): T => {
    const data = fs.readFileSync(filePath, "utf8");
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON from ${filePath}: ${(error as Error).message}`);
    }
  };

  const makeKey = (locale: string, relativePath: string): string =>
    `./${locale}/${relativePath}`.replace(/\\/g, "/");

  const entries = fs.readdirSync(localesRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_")) continue;

    const locale = entry.name;
    const localeDir = path.join(localesRoot, locale);

    const legacyFile = path.join(localeDir, "guides.json");
    if (fs.existsSync(legacyFile) && fs.statSync(legacyFile).isFile()) {
      legacyModules[makeKey(locale, "guides.json")] = {
        default: readJsonFile<GuidesNamespace>(legacyFile),
      };
    }

    const guidesDir = path.join(localeDir, "guides");
    if (!fs.existsSync(guidesDir) || !fs.statSync(guidesDir).isDirectory()) {
      continue;
    }

    const stack: Array<{ dir: string; segments: string[] }> = [{ dir: guidesDir, segments: [] }];

    while (stack.length > 0) {
      const { dir, segments } = stack.pop()!;
      const children = fs.readdirSync(dir, { withFileTypes: true });

      for (const child of children) {
        if (child.name.startsWith("_")) continue;
        const nextSegments = [...segments, child.name];
        const absolute = path.join(dir, child.name);

        if (child.isDirectory()) {
          stack.push({ dir: absolute, segments: nextSegments });
          continue;
        }

        if (!child.isFile() || !child.name.endsWith(".json")) {
          continue;
        }

        const relativePath = ["guides", ...nextSegments].join("/");
        const data = readJsonFile(absolute);
        splitGlobalModules[makeKey(locale, relativePath)] = { default: data };

        if (nextSegments[0] === "content" && nextSegments.length === 2) {
          splitContentModules[makeKey(locale, relativePath)] = { default: data };
        }
      }
    }
  }

  return {
    legacy: legacyModules,
    splitGlobal: splitGlobalModules,
    splitContent: splitContentModules,
  } satisfies ModuleOverrides;
}
