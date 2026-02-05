/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
import { IS_SERVER } from "@/config/env";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { loadLocaleResource } from "@/locales/locale-loader";
import { IS_DEV } from "@/config/env";

import type { GuidesNamespace } from "../locales/guides.types";

const nodeCache = new Set<string>();
// Cross-runtime guard to avoid duplicate adds even when SSR detection falls back
const onceCache = new Set<string>();

const shouldReloadEveryTimeInDev = (ns: string): boolean => {
  // In Next dev, i18n resource bundles are cached in-memory across requests.
  // That is great for performance, but it means edits to guide JSON files won't
  // show up until a server restart (and client HMR can also preserve old state).
  //
  // The guides namespace is edited frequently during authoring, so prefer
  // correctness over caching in dev.
  if (!IS_DEV) return false;
  return ns === "guides" || ns === "guidesFallback";
};

const isSeededBundle = (ns: string, existing: Record<string, unknown>): boolean => {
  if (ns === "dealsPage") {
    return (
      Object.keys(existing).length === 1 &&
      Array.isArray((existing as { perksList?: unknown }).perksList)
    );
  }

  if (ns === "guides.tags") {
    const tags = (existing as { tags?: Record<string, unknown> }).tags;
    if (!tags || typeof tags !== "object") return false;
    const keys = Object.keys(tags);
    return keys.length === 1 && keys[0] === "transport";
  }

  return false;
};

// Server-runtime detection that works in Vitest (jsdom has `window`).
// Prefer SSR flag when available; fall back to lack of `window`.
const isServerRuntime = () => IS_SERVER;

async function loadBundleViaImport(lang: string, ns: string): Promise<unknown | undefined> {
  return loadLocaleResource(lang, ns);
}

let nodeFs: typeof import("fs") | undefined;
let nodePath: typeof import("path") | undefined;

async function ensureNodeFs() {
  if (nodeFs && nodePath) {
    return { fs: nodeFs, path: nodePath };
  }

  const { createRequire } = (await import("module")) as unknown as typeof import("module");
  const req = createRequire(import.meta.url);
  nodeFs = req("fs") as typeof import("fs");
  nodePath = req("path") as typeof import("path");

  return { fs: nodeFs, path: nodePath };
}

async function loadBundleFromFs(lang: string, ns: string): Promise<unknown | undefined> {
  try {
    const { fs, path } = await ensureNodeFs();
    const candidates = [
      path.resolve(process.cwd(), "build/server/locales", lang, `${ns}.json`),
      path.resolve(process.cwd(), "src/locales", lang, `${ns}.json`),
      path.resolve(process.cwd(), "apps/brikette/build/server/locales", lang, `${ns}.json`),
      path.resolve(process.cwd(), "apps/brikette/src/locales", lang, `${ns}.json`),
      new URL(`../locales/${lang}/${ns}.json`, import.meta.url).pathname,
    ];

    for (const candidate of candidates) {
      try {
        const raw = fs.readFileSync(candidate, "utf8");
        return JSON.parse(raw);
      } catch {
        // try next candidate
      }
    }
  } catch {
    // fall through to return undefined
  }

  return undefined;
}

/**
 * Load one (lang, ns) bundle exactly once.
 */
export async function loadI18nNs(lang: string, ns: string): Promise<void> {
  const onceKey = `${lang}/${ns}`;
  const forceReload = shouldReloadEveryTimeInDev(ns);
  const hasExistingResource = (() => {
    if (typeof i18n.hasResourceBundle !== "function") return false;
    try {
      return i18n.hasResourceBundle(lang, ns);
    } catch {
      return false;
    }
  })();

  const existing = (() => {
    if (typeof i18n.getResourceBundle !== "function") return undefined;
    try {
      return i18n.getResourceBundle(lang, ns) as Record<string, unknown> | undefined;
    } catch {
      return undefined;
    }
  })();

  const hasValidExisting =
    (existing &&
      typeof existing === "object" &&
      Object.keys(existing).length > 0 &&
      !isSeededBundle(ns, existing)) ||
    (hasExistingResource && existing === undefined);

  if (hasValidExisting && !forceReload) {
    onceCache.add(onceKey);
    return;
  }

  if (onceCache.has(onceKey) && !forceReload) return;

  if (isServerRuntime()) {
    const key = `${lang}/${ns}`;
    if (nodeCache.has(key) && !forceReload) return;

    if (ns === "guides") {
      const guidesBundle = await loadGuidesNamespace(lang);
      if (guidesBundle) {
        i18n.addResourceBundle(lang, ns, guidesBundle, true, true);
        if (!forceReload) {
          nodeCache.add(key);
          onceCache.add(onceKey);
        }
        return;
      }
    }
    const dataFromImport = await loadBundleViaImport(lang, ns);
    if (typeof dataFromImport !== "undefined") {
      i18n.addResourceBundle(lang, ns, dataFromImport, true, true);
      if (!forceReload) {
        nodeCache.add(key);
        onceCache.add(onceKey);
      }
      return;
    }

    const fsData = await loadBundleFromFs(lang, ns);
    if (typeof fsData !== "undefined") {
      i18n.addResourceBundle(lang, ns, fsData, true, true);
      if (!forceReload) {
        nodeCache.add(key);
        onceCache.add(onceKey);
      }
      return;
    }

    throw new Error(`Missing i18n namespace bundle for ${lang}/${ns}`);
  } else {
    if (ns === "guides") {
      const guidesBundle = await loadGuidesNamespace(lang);
      if (guidesBundle) {
        i18n.addResourceBundle(lang, ns, guidesBundle, true, true);
        if (!forceReload) {
          onceCache.add(onceKey);
        }
        return;
      }
    }

    // Primary: attempt a direct dynamic import for browser/runtime contexts
    const data = await loadBundleViaImport(lang, ns);

    // Final fallback for test environments (node + jsdom without Vite)
    if (typeof data === "undefined") {
      const fsData = await loadBundleFromFs(lang, ns);
      if (typeof fsData !== "undefined") {
        i18n.addResourceBundle(lang, ns, fsData, true, true);
        if (!forceReload) {
          onceCache.add(onceKey);
        }
        return;
      }
      throw new Error(`Missing i18n namespace bundle for ${lang}/${ns}`);
    }

    i18n.addResourceBundle(lang, ns, data, true, true);
    if (!forceReload) {
      onceCache.add(onceKey);
    }
  }
}

/**
 * Preload multiple namespaces for a given language.
 * If `optional` is true, missing bundles are ignored.
 */
export async function preloadI18nNamespaces(
  lang: string,
  namespaces: readonly string[],
  opts: { optional?: boolean } = {}
): Promise<void> {
  const { optional = false } = opts;
  await Promise.all(
    namespaces.map(async (ns) => {
      try {
        await loadI18nNs(lang, ns);
      } catch (err) {
        if (!optional) throw err;
      }
    })
  );
}

type PreloadWithFallbackOptions = {
  optional?: boolean;
  fallbackLang?: AppLanguage;
  fallbackOptional?: boolean;
  preload?: typeof preloadI18nNamespaces;
};

const FALLBACK_LANGUAGE = i18nConfig.fallbackLng as AppLanguage;

/**
 * Ensure both the active locale and fallback locale have the requested
 * namespaces available so UI never renders bare translation keys while the
 * async bundle finishes loading.
 */
export async function preloadNamespacesWithFallback(
  lang: AppLanguage,
  namespaces: readonly string[],
  options: PreloadWithFallbackOptions = {}
): Promise<void> {
  const {
    optional = false,
    fallbackOptional = optional,
    fallbackLang = FALLBACK_LANGUAGE,
    preload = preloadI18nNamespaces,
  } = options;

  await preload(lang, namespaces, { optional });

  if (!fallbackLang || fallbackLang === lang) {
    return;
  }

  await preload(fallbackLang, namespaces, { optional: fallbackOptional });
}

async function loadGuidesNamespace(lang: string): Promise<GuidesNamespace | undefined> {
  const hasNode =
    typeof process !== "undefined" &&
    Boolean((process as unknown as { versions?: { node?: unknown } }).versions?.node);

  try {
    const { loadGuidesNamespace } = await import("@/locales/guides.backend");
    return (
      (await loadGuidesNamespace(lang, { canUseNodeFs: isServerRuntime() || hasNode })) ?? undefined
    );
  } catch {
    return undefined;
  }
}
