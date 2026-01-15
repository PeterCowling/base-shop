/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// file path: src/i18n.ts
// -----------------------------------------------------------------------------
// Universal i18next bootstrap (lazy bundles via backend)
// - Browser/Next bundles      → dynamic imports of JSON chunks
// - Plain Node (scripts/tests)→ fs fallback inside the backend
// -----------------------------------------------------------------------------

import i18n, { type ReadCallback } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";
import { i18nConfig } from "./i18n.config";
import EN_TRANSLATION from "./locales/en/translation.json";
import EN_FOOTER from "./locales/en/footer.json";
import { loadLocaleResource } from "./locales/locale-loader";
// Seed critical assistance article namespaces for English to avoid hydration
// drift on direct loads of help articles before lazy bundles resolve.
import EN_ASSIST_AGE from "./locales/en/ageAccessibility.json";
import EN_ASSIST_BOOKING from "./locales/en/bookingBasics.json";
import EN_ASSIST_CHANGE from "./locales/en/changingCancelling.json";
import EN_ASSIST_CHECKIN from "./locales/en/checkinCheckout.json";
import EN_ASSIST_DEFECTS from "./locales/en/defectsDamages.json";
import EN_ASSIST_DEPOSITS from "./locales/en/depositsPayments.json";
import EN_ASSIST_RULES from "./locales/en/rules.json";
import EN_ASSIST_LEGAL from "./locales/en/legal.json";
import EN_ASSIST_SECURITY from "./locales/en/security.json";
import EN_ASSIST_ARRIVE_FERRY from "./locales/en/arrivingByFerry.json";
import EN_ASSIST_AIRPORT_BUS from "./locales/en/naplesAirportBus.json";
import EN_ASSIST_TRAVEL_HELP from "./locales/en/travelHelp.json";
import { getGuidesBundle } from "./locales/guides";
import { loadGuidesNamespaceFromImports } from "./locales/guides.imports";
// (blog namespace removed)

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
        cb(null, overrideBundle as import("i18next").ResourceKey);
        return;
      }
    }

    // Prefer the Node FS loader for the guides namespace when running under Node
    // (tests/scripts). This avoids a race where the runtime module discovery
    // hasn’t warmed yet and getGuidesBundle() returns a stub.
    if (ns === "guides" && canUseNodeFs) {
      try {
        const { loadGuidesNamespaceFromFs } = await import("@/locales/_guides/node-loader");
        const fromFs = loadGuidesNamespaceFromFs(lng);
        if (fromFs) {
          cb(null, fromFs as import("i18next").ResourceKey);
          return;
        }
      } catch {
        // Fall back to other strategies below
      }
    }

    if (ns === "guides") {
      const bundle = getGuidesBundle(lng);
      if (bundle) {
        cb(null, bundle as import("i18next").ResourceKey);
        return;
      }
      try {
        const imported = await loadGuidesNamespaceFromImports(lng);
        if (imported) {
          cb(null, imported as import("i18next").ResourceKey);
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
        cb(null, data as import("i18next").ResourceKey);
        return;
      }
    } catch {
      /* fall through */
    }

    // 2) Plain Node fallback via fs (prioritised under Node/vitest)
    if (canUseNodeFs) {
      try {
        if (ns === "guides") {
          // Secondary attempt; usually short‑circuited by the early Node branch.
          const { loadGuidesNamespaceFromFs } = await import("@/locales/_guides/node-loader");
          const bundle = loadGuidesNamespaceFromFs(lng);
          if (bundle) {
            cb(null, bundle as import("i18next").ResourceKey);
            return;
          }
        }
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
    console.warn(`[i18n] ${lng}/${ns}.json not found – falling back to empty object`);
    cb(null, {});
  })
)
  // Some tests mock `react-i18next` without exporting `initReactI18next`.
  // Guard by falling back to a no-op plugin so i18n can still initialise.
  .use(
    (((initReactI18next as unknown) as import("i18next").Module) ||
      ({ type: "3rdParty", init() {} } as import("i18next").Module))
  )
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
          translation: EN_TRANSLATION as unknown as import("i18next").ResourceKey,
          footer: EN_FOOTER as unknown as import("i18next").ResourceKey,
          // Assistance (help) article namespaces: seed English bundles to
          // guarantee immediate availability on hydration. Other languages
          // continue to load lazily via the backend.
          ageAccessibility: EN_ASSIST_AGE as unknown as import("i18next").ResourceKey,
          bookingBasics: EN_ASSIST_BOOKING as unknown as import("i18next").ResourceKey,
          changingCancelling: EN_ASSIST_CHANGE as unknown as import("i18next").ResourceKey,
          checkinCheckout: EN_ASSIST_CHECKIN as unknown as import("i18next").ResourceKey,
          defectsDamages: EN_ASSIST_DEFECTS as unknown as import("i18next").ResourceKey,
          depositsPayments: EN_ASSIST_DEPOSITS as unknown as import("i18next").ResourceKey,
          rules: EN_ASSIST_RULES as unknown as import("i18next").ResourceKey,
          legal: EN_ASSIST_LEGAL as unknown as import("i18next").ResourceKey,
          security: EN_ASSIST_SECURITY as unknown as import("i18next").ResourceKey,
          arrivingByFerry: EN_ASSIST_ARRIVE_FERRY as unknown as import("i18next").ResourceKey,
          naplesAirportBus: EN_ASSIST_AIRPORT_BUS as unknown as import("i18next").ResourceKey,
          travelHelp: EN_ASSIST_TRAVEL_HELP as unknown as import("i18next").ResourceKey,
          // (blog namespace removed)
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
        const seed = createGuidesTagsSeed(label) as import("i18next").ResourceKey;
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
