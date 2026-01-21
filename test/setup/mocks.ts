/**
 * Phase 3: Mocks and Test Utilities
 *
 * Sets up global mocks and test infrastructure that must be available before
 * any test runs. This file runs after polyfills are loaded.
 *
 * Includes:
 * - @testing-library/jest-dom matchers
 * - Testing Library configuration (data-cy testIdAttribute)
 * - MSW (Mock Service Worker) server lifecycle
 * - NextAuth mock state reset hooks
 * - Next.js app router mocks (useRouter, useSearchParams, etc.)
 * - @acme/i18n mock with default English translations
 * - Console noise filtering
 *
 * IMPORTANT: This file runs in Jest's setupFilesAfterEnv, so the test
 * environment (jsdom/node) is fully initialized and globals are available.
 */

// ============================================================================
// Testing Library Setup
// ============================================================================

import "@testing-library/jest-dom";

// Configure Testing Library to use data-cy as testIdAttribute
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { configure } = require("@testing-library/react");
configure({ testIdAttribute: "data-cy" });

// ============================================================================
// Next.js App Router Mocks
// ============================================================================

// Provide lightweight mocks for Next.js app router hooks so client components
// using useRouter/useSearchParams can render without a mounted app router.
// Tests that need custom behavior can override this per-suite.
try {
  jest.mock("next/navigation", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const actual = jest.requireActual("next/navigation");
    const params = new URLSearchParams("");
    return {
      ...actual,
      useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
      }),
      useSearchParams: () => params,
    };
  });
} catch {
  // Ignore if mock already exists
}

// ============================================================================
// i18n Mock with Default English Translations
// ============================================================================

// Provide default English translations for components that call useTranslations().
// Tests can override by mocking @acme/i18n locally or using TranslationsProvider
// with custom messages. This keeps legacy tests that don't mount a provider working.
try {
  jest.mock("@acme/i18n", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const actual = jest.requireActual("@acme/i18n");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const en = require("@acme/i18n/en.json");

    type Messages = Record<string, string>;

    const translatorByRef = new WeakMap<Messages, (key: string, vars?: Record<string, string | number>) => string>();
    const translatorByContent = new Map<string, (key: string, vars?: Record<string, string | number>) => string>();

    const cacheKey = (msgs: Messages): string =>
      Object.keys(msgs)
        .sort()
        .map((k) => `${k}:${String(msgs[k])}`)
        .join("|");

    const createTranslator = (msgs: Messages) => {
      return (key: string, vars?: Record<string, string | number>) => {
        const template = msgs[key];
        const value = typeof template === "string" ? template : key;
        if (!vars) return value;
        return value.replace(/\{(.*?)\}/g, (match, name) =>
          Object.prototype.hasOwnProperty.call(vars, name)
            ? String(vars[name] as string | number)
            : match
        );
      };
    };

    const getTranslator = (msgs: Messages) => {
      const direct = translatorByRef.get(msgs);
      if (direct) return direct;

      const key = cacheKey(msgs);
      const byContent = translatorByContent.get(key);
      if (byContent) {
        translatorByRef.set(msgs, byContent);
        return byContent;
      }

      const built = createTranslator(msgs);
      translatorByRef.set(msgs, built);
      translatorByContent.set(key, built);
      return built;
    };

    let currentMessages: Messages = en;
    let currentTranslator = getTranslator(currentMessages);

    const TranslationsProvider = ({
      messages,
      children,
    }: {
      messages?: Messages;
      children: React.ReactNode;
    }) => {
      const active = messages && Object.keys(messages).length ? messages : en;
      if (active !== currentMessages) {
        currentMessages = active;
        currentTranslator = getTranslator(active);
      }
      return children as unknown as React.JSX.Element;
    };

    const useTranslations = () => currentTranslator;

    return {
      ...actual,
      TranslationsProvider,
      default: TranslationsProvider,
      useTranslations,
    };
  });
} catch {
  // Ignore if mock already exists
}

// ============================================================================
// MSW (Mock Service Worker) Setup
// ============================================================================

// Allow lightweight packages to disable MSW when unnecessary by setting MSW_DISABLE=1
let __mswServer: { listen: Function; resetHandlers: Function; close: Function } | undefined;
try {
  if (process.env.MSW_DISABLE !== "1") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { server } = require("../msw/server");
    __mswServer = server;
  }
} catch {
  // MSW not available or not needed
}

if (__mswServer) {
  beforeAll(() => __mswServer?.listen?.({ onUnhandledRequest: "error" }));
  afterEach(() => __mswServer?.resetHandlers?.());
  afterAll(() => {
    try {
      __mswServer?.close?.();
    } catch (error) {
      // MSW 2.x can throw when tearing down fetch interceptors in jsdom.
      // Tests are finished at this point, so swallow the teardown failure.
      if (process.env.CI) {
        throw error;
      }
    }
  });
}

// ============================================================================
// NextAuth Mock State Reset
// ============================================================================

// Reset shared auth/config mocks between tests to avoid leakage across suites
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auth = require("next-auth");
  if (auth && typeof auth.__resetMockSession === "function") {
    afterEach(() => auth.__resetMockSession());
  }
} catch {
  // next-auth not mocked
}

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const authJwt = require("next-auth/jwt");
  if (authJwt && typeof authJwt.__resetMockToken === "function") {
    afterEach(() => authJwt.__resetMockToken());
  }
} catch {
  // next-auth/jwt not mocked
}

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const authReact = require("next-auth/react");
  if (authReact && typeof authReact.__resetReactAuthImpls === "function") {
    afterEach(() => authReact.__resetReactAuthImpls());
  }
} catch {
  // next-auth/react not mocked
}

// ============================================================================
// Console Noise Filtering
// ============================================================================

/**
 * Some third-party dependencies emit console noise (e.g., JSDOM's navigation
 * warnings or env validation helpers that fail intentionally in tests).
 * Filter specific, known-noisy messages to keep logs readable while preserving
 * all other console output.
 */
type ConsolePattern = string | RegExp;

const JSDOM_NAV_ERROR = "Not implemented: navigation (except hash changes)";

const IGNORED_ERROR_PATTERNS: ConsolePattern[] = [
  JSDOM_NAV_ERROR,
  // Service-layer logs exercised in tests
  "Failed to unpublish post",
  "Failed to list media",
  // React dev warnings for DS props on DOM elements
  /React does not recognize the `%s` prop on a DOM element\..*labelClassName/,
  /React does not recognize the `%s` prop on a DOM element\..*trailingIcon/,
  "Failed to load upgrade changes Only absolute URLs are supported",
  // Env validation helpers – intentionally exercised with invalid inputs
  "❌ Invalid CMS environment variables",
  "❌ Invalid core environment variables",
  "❌ Invalid email environment variables",
  "❌ Invalid payments environment variables",
  "❌ Invalid shipping environment variables",
  "❌ Unsupported PAYMENTS_PROVIDER:",
  "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe",
  "❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY when PAYMENTS_PROVIDER=stripe",
  "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe",
  "Failed to send campaign email",
  // Bullet-point issue details printed by core/shipping env loaders
  /^  • .*: .+/,
];

const IGNORED_WARN_PATTERNS: ConsolePattern[] = [
  "⚠️ Invalid payments environment variables",
];

const shouldIgnoreConsoleMessage = (
  args: unknown[],
  patterns: ConsolePattern[],
): boolean => {
  const aggregated = args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg && typeof (arg as any).message === "string") {
        return (arg as any).message;
      }
      return "";
    })
    .join(" ");

  return patterns.some((pattern) =>
    typeof pattern === "string"
      ? aggregated.includes(pattern)
      : pattern.test(aggregated),
  );
};

// Patch the global console so Jest's console tracking never sees ignored messages.
// Tests that need to assert on console output can still install their own spies
// via jest.spyOn(console, 'error' | 'warn').
(() => {
  const originalConsole = globalThis.console;
  const patchedConsole = Object.create(originalConsole) as Console;

  patchedConsole.error = (...args: unknown[]) => {
    if (shouldIgnoreConsoleMessage(args, IGNORED_ERROR_PATTERNS)) return;
    originalConsole.error(...(args as []));
  };

  patchedConsole.warn = (...args: unknown[]) => {
    if (shouldIgnoreConsoleMessage(args, IGNORED_WARN_PATTERNS)) return;
    originalConsole.warn(...(args as []));
  };

  // eslint-disable-next-line no-console
  globalThis.console = patchedConsole;
})();
