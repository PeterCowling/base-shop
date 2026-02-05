/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// file path: src/i18n.ts
// -----------------------------------------------------------------------------
// Universal i18next bootstrap (lazy bundles via backend)
// - Browser/Next bundles      → dynamic imports of JSON chunks
// - Plain Node (scripts/tests)→ fs fallback inside the backend
// -----------------------------------------------------------------------------

import i18n, { type ReadCallback } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";

import { i18nConfig } from "./i18n.config";
import EN_FOOTER from "./locales/en/footer.json";
import EN_TRANSLATION from "./locales/en/translation.json";
import { loadLocaleResource } from "./locales/locale-loader";
import { asResourceKey } from "./utils/i18n-types";
// (blog namespace removed)

// react-i18next must not be imported in React Server Components (the server
// runtime can expose a React build without createContext). Guard on the React
// API surface before requiring the plugin.
type I18nextModule = import("i18next").Module;
let initReactI18next: I18nextModule | null = null;
try {
   
  const react = require("react") as { createContext?: unknown };
  if (typeof react.createContext === "function") {
     
    const reactI18next = require("react-i18next") as { initReactI18next?: unknown };
    const candidate = reactI18next.initReactI18next as unknown;
    if (
      candidate &&
      typeof candidate === "object" &&
      "type" in (candidate as Record<string, unknown>) &&
      "init" in (candidate as Record<string, unknown>) &&
      typeof (candidate as { init?: unknown }).init === "function"
    ) {
      initReactI18next = candidate as I18nextModule;
    }
  }
} catch {
  initReactI18next = null;
}

/*---------------------------------------------------------------*
 | Environment detection                                          |
 *---------------------------------------------------------------*/
// In Vitest/JSDOM, `window` exists but Node APIs are still available. Prefer this
// more permissive check when deciding if we can use Node FS helpers.
const canUseNodeFs = typeof process !== "undefined" && !!process.versions?.node;
/*---------------------------------------------------------------*
 | Node helpers are resolved lazily inside the backend branch     |
 | to avoid client-bundle warnings about node:module.             |
 *---------------------------------------------------------------*/

const TRANSPORT_TAG_LABELS: Record<string, string> = {
  en: "Transport",
  de: "Verkehr",
  es: "Transporte",
  fr: "Transports",
  it: "Trasporti",
  pt: "Transporte",
  ru: "Транспорт",
  zh: "交通",
  ja: "交通",
  ko: "교통",
};

const createGuidesTagsSeed = (label: string) =>
  ({
    tags: {
      transport: {
        label,
      },
    },
  }) satisfies Record<string, unknown>;

/*---------------------------------------------------------------*
 | Backend: load JSON by (lng, ns) in any runtime                 |
 *---------------------------------------------------------------*/
// Dynamic imports are handled by Next/webpack; Node contexts fall back to fs.

i18n.use(
  resourcesToBackend(async (lng, ns, cb: ReadCallback) => {
    if (ns === "guides") {
      const overrides = (globalThis as {
        __GUIDES_BACKEND_OVERRIDES__?: Record<string, unknown>;
      }).__GUIDES_BACKEND_OVERRIDES__;
      const overrideBundle = overrides?.[lng];
      if (overrideBundle) {
        if (process.env["DEBUG_GUIDE_TRANSLATIONS"] === "1") {
          // eslint-disable-next-line no-console -- Localised debug helper for guide coverage tests
          console.log(`[i18n] using guides override for ${lng}`);
        }
        cb(null, asResourceKey(overrideBundle));
        return;
      }
    }

    // Prefer the Node FS loader for the guides namespace when running under Node
    // (tests/scripts). This avoids a race where the runtime module discovery
    // hasn’t warmed yet and getGuidesBundle() returns a stub.
    if (ns === "guides") {
      try {
        const { loadGuidesNamespace } = await import("./locales/guides.backend");
        const bundle = await loadGuidesNamespace(lng, { canUseNodeFs });
        if (bundle) {
          cb(null, asResourceKey(bundle));
          return;
        }
      } catch {
        // fall through to other strategies
      }
    }

    // 1) Try bundle-aware import (browser/Next bundles)
    try {
      const data = await loadLocaleResource(lng, ns);
      if (typeof data !== "undefined") {
        cb(null, asResourceKey(data));
        return;
      }
    } catch {
      /* fall through */
    }

    // 2) Plain Node fallback via fs (prioritised under Node/vitest)
    if (canUseNodeFs) {
      try {
        const mod = await import("module");
        const { createRequire } = mod as unknown as typeof import("module");
        const req = createRequire(import.meta.url);
        const fs = req("fs") as typeof import("fs");
        const path = req("path") as typeof import("path");
        const candidates: string[] = [
          path.resolve(process.cwd(), "src/locales", lng, `${ns}.json`),
          path.resolve(process.cwd(), "apps/brikette/src/locales", lng, `${ns}.json`),
        ];
        try {
          // __dirname is not available in ESM – guard access so we don't throw
          // in environments where it is undefined.
          if (typeof __dirname === "string") {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- LINT-1007 [ttl=2026-12-31] __dirname is CJS-only and guarded at runtime
            // @ts-ignore __dirname only exists in CJS; guarded at runtime
            candidates.push(path.resolve(__dirname as unknown as string, "locales", lng, `${ns}.json`));
          }
        } catch {
          // ignore when __dirname is not defined under ESM
        }
        for (const file of candidates) {
          try {
            const data = fs.readFileSync(file, "utf8");
            cb(null, JSON.parse(data));
            return;
          } catch {
            /* try next */
          }
        }
      } catch (err) {
        cb(err as Error, undefined);
        return;
      }
    }

    // 3) Graceful empty object
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] ${lng}/${ns}.json not found – falling back to empty object`);
    }
    cb(null, {});
  })
)
  // Some tests mock `react-i18next` without exporting `initReactI18next`.
  // Guard by falling back to a no-op plugin so i18n can still initialise.
  .use(initReactI18next ?? ({ type: "3rdParty", init() {} } as import("i18next").Module))
  .init({
    ...i18nConfig,
    // Ensure components re-render both when the language changes
    // and when lazy namespaces finish loading for that language.
    // This aligns runtime behavior with dev navigation where we
    // change the URL first and load namespaces after.
    react: {
      useSuspense: false,
      bindI18n: "languageChanged loaded",
      bindI18nStore: "added removed",
    },
    // Synchronous init for tests; namespaces still lazy‑load via backend
    initImmediate: false,
    // Seed a minimal dealsPage perks list for en so components depending on it
    // can render immediately in unit tests. Other namespaces load lazily.
    resources: (() => {
      const base: Record<string, import("i18next").ResourceLanguage> = {
        en: {
          translation: asResourceKey(EN_TRANSLATION),
          footer: asResourceKey(EN_FOOTER),
          // (legacy article namespaces removed - now served via guides)
          dealsPage: {
            // eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI seed values for tests; real copy lives in locales JSON
            // i18n-exempt -- LINT-1007 [ttl=2026-12-31]
            perksList: [
              {
                title: "Complimentary breakfast voucher",
                subtitle: "Included daily",
              },
              {
                title: "Exclusive direct booking discount",
                subtitle: "Auto-applied",
              },
              {
                title: "Welcome drink at the bar",
                subtitle: "House selection",
              },
            ],
            // eslint-enable ds/no-hardcoded-copy
          },
        },
      };

      for (const [lang, label] of Object.entries(TRANSPORT_TAG_LABELS)) {
        const seed = asResourceKey(createGuidesTagsSeed(label));
        const target = (base[lang] ??= {});
        (target as Record<string, import("i18next").ResourceKey>)["guides.tags"] = seed;
      }

      return base;
    })(),
  });

// ---------------------------------------------------------------------------
// Compatibility: i18next v24 no longer exposes `loadNamespaces` on the
// instance in some builds. A few tests and utilities rely on this helper to
// eagerly ensure a namespace is available before rendering assertions. To keep
// call‑sites stable across versions, provide a lightweight shim that defers to
// the backend connector when present.
// ---------------------------------------------------------------------------
const appI18n = i18n as typeof i18n & {
  loadNamespaces: (ns: string | string[]) => Promise<void>;
};

// Normalise the loadNamespaces helper across i18next versions so tests and
// runtime code can rely on it existing. i18next v24 removed it from some
// builds which caused callers like `i18n.loadNamespaces()` to throw.
appI18n.loadNamespaces = (ns: string | string[]): Promise<void> => {
  const namespaces = Array.isArray(ns) ? ns : [ns];
  return new Promise<void>((resolve, reject) => {
    // Prefer backendConnector.load which triggers our resourcesToBackend loader
    type BackendConnector = {
      load?: (
        languages: readonly string[],
        namespaces: readonly string[],
        callback: (error: unknown) => void,
      ) => void;
    };
    type I18nWithBackend = typeof appI18n & {
      services?: {
        backendConnector?: BackendConnector;
      };
    };

    const services = (appI18n as I18nWithBackend).services;
    const backend = services?.backendConnector;
    const fallback = i18n.options?.fallbackLng;
    const fallbackLang = Array.isArray(fallback) ? fallback[0] : (fallback as string | undefined);
    const lng = i18n.language || fallbackLang || "en";
    const languages = [lng];
    const namespaceList = namespaces as readonly string[];

    const emitLoaded = () => {
      if (typeof i18n.emit !== "function") return;
      const payload: Record<string, readonly string[]> = {};
      for (const language of languages) {
        if (language) {
          payload[language] = namespaceList;
        }
      }
      if (Object.keys(payload).length > 0) {
        i18n.emit("loaded", payload);
      }
    };
    if (backend && typeof backend.load === "function") {
      backend.load(languages, namespaceList, (err: unknown) => {
        if (err) {
          reject(err as Error);
          return;
        }
        emitLoaded();
        resolve();
      });
      return;
    }
    // Fallback: try reloading resources if available, otherwise resolve
    if (typeof i18n.reloadResources === "function") {
      i18n
        .reloadResources(languages, namespaceList)
        .then(() => {
          emitLoaded();
          resolve();
        })
        .catch(reject);
      return;
    }
    emitLoaded();
    resolve();
  });
};

export default appI18n;
