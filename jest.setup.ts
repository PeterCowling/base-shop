// jest.setup.ts
/* eslint-env jest */
/* -------------------------------------------------------------------------- */
/*  Executed **once** before the Jest environment is ready                    */
/* -------------------------------------------------------------------------- */

// Keep Browserslist from emitting staleness warnings during tests
process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";
process.env.BROWSERSLIST_DISABLE_CACHE = "1";

// DOM shims common to jsdom tests
import "./test/polyfills/dom-compat";

// Note: Do not auto‑mock `@prisma/client` here. Jest's moduleNameMapper
// points `@prisma/client` to a manual mock at `__mocks__/@prisma/client.ts`.
// Calling `jest.mock('@prisma/client')` would override that with an auto‑mock
// and break tests that expect the manual mock's API.

/* -------------------------------------------------------------------------- */
/* 1.  Environment variables expected by the app while running tests          */
/* -------------------------------------------------------------------------- */

/**
 * In @types/node ≥ 22 every key in `process.env` is marked `readonly`,
 * so direct assignment (`process.env.NODE_ENV = …`) now fails with
 * TS 2540.
 * We work around that by first casting to a mutable record.
 */
const internalEnv = process.env;
const mutableEnv = internalEnv as unknown as Record<string, string>;

Object.defineProperty(process, "env", {
  configurable: true,
  get() {
    return internalEnv;
  },
  set(nextEnv: NodeJS.ProcessEnv) {
    if (nextEnv && nextEnv !== internalEnv) {
      for (const key of Object.keys(internalEnv)) {
        delete internalEnv[key];
      }
      for (const [key, value] of Object.entries(nextEnv)) {
        if (typeof value !== "undefined") {
          internalEnv[key] = value;
        }
      }
    }
    if (!nextEnv || !Object.prototype.hasOwnProperty.call(nextEnv, "EMAIL_FROM")) {
      if (typeof internalEnv.EMAIL_FROM !== "string") {
        internalEnv.EMAIL_FROM = "test@example.com";
      }
    }
  },
});

mutableEnv.NODE_ENV ||= "development"; // relax "edge" runtime checks
mutableEnv.LOG_LEVEL ||= "silent"; // suppress pino/metric logging during tests
mutableEnv.CART_COOKIE_SECRET ||= "test-cart-secret"; // cart cookie signing
mutableEnv.STRIPE_WEBHOOK_SECRET ||= "whsec_test"; // dummy Stripe webhook secret
mutableEnv.EMAIL_FROM ||= "test@example.com"; // dummy sender email
// Ensure auth secrets are long enough even if the host environment provides
// shorter values (e.g. from a `.env` file or CI configuration). Jest's
// `setupFiles` load `dotenv` before this script runs, so we can't rely on the
// `||=` operator here because existing but too-short values would remain. If
// the variable is missing or shorter than 32 characters, replace it with a
// deterministic test secret.
const ensureSecret = (key: string, fallback: string) => {
  const current = process.env[key];
  if (!current || current.length < 32) {
    mutableEnv[key] = fallback;
  }
};
ensureSecret(
  "NEXTAUTH_SECRET",
  "test-nextauth-secret-32-chars-long-string!",
);
ensureSecret(
  "SESSION_SECRET",
  "test-session-secret-32-chars-long-string!",
);
mutableEnv.CMS_SPACE_URL ||= "https://cms.example.com";
mutableEnv.CMS_ACCESS_TOKEN ||= "cms-access-token";
mutableEnv.SANITY_API_VERSION ||= "2023-01-01";
mutableEnv.AUTH_TOKEN_TTL ||= "15m";
mutableEnv.EMAIL_FROM ||= "test@example.com";
// Silence Browserslist “data is 6 months old” warnings during tests
mutableEnv.BROWSERSLIST_IGNORE_OLD_DATA ||= "1";
mutableEnv.EMAIL_PROVIDER ||= "smtp";
// Use Stripe mock client by default in tests to avoid requiring secrets
mutableEnv.STRIPE_USE_MOCK ||= "true";

/* -------------------------------------------------------------------------- */
/* 2.  Polyfills missing from the JSDOM / Node test runtime                    */
/* -------------------------------------------------------------------------- */

import "@testing-library/jest-dom";
// Configure Testing Library defaults
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { configure } = require("@testing-library/react");
configure({ testIdAttribute: "data-cy" });
import "./test/polyfills/form-request-submit";
// Provide a harmless confirm() stub that tests can spy on or override
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).confirm = (msg?: string) => false;
} catch {}

// React/Next + DOM polyfills are provided via test/polyfills/*

// Provide a lightweight mock for Next.js app router hooks so client components
// using `useRouter`/`useSearchParams` can render in Jest without a mounted app
// router. Tests that need custom behavior can override this per‑suite.
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
} catch {}

// Provide default English translations for components that call useTranslations()
// Tests can still override this by mocking @acme/i18n locally or by using
// TranslationsProvider with custom messages. This keeps legacy tests that do
// not mount a provider working by falling back to en.json.
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
} catch {}

/**
 * React 19+ uses `MessageChannel` internally for suspense & streaming.
 * Node’s impl can leave ports open, preventing Jest from exiting, so
 * a lightweight stub is installed via `test/polyfills/messageChannel.js`.
 */

// Response.json() polyfill is provided centrally via `test/setup-response-json.ts`.

/* -------------------------------------------------------------------------- */
/* 3.  MSW (Mock Service Worker) – network stubbing for API calls             */
/* -------------------------------------------------------------------------- */

// Allow lightweight packages to disable MSW when unnecessary
let __mswServer: { listen: Function; resetHandlers: Function; close: Function } | undefined;
try {
  if (process.env.MSW_DISABLE !== "1") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { server } = require("./test/msw/server");
    __mswServer = server;
  }
} catch {}

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

// Reset shared auth/config mocks between tests to avoid leakage across suites
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auth = require("next-auth");
  if (auth && typeof auth.__resetMockSession === "function") {
    afterEach(() => auth.__resetMockSession());
  }
} catch {}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const authJwt = require("next-auth/jwt");
  if (authJwt && typeof authJwt.__resetMockToken === "function") {
    afterEach(() => authJwt.__resetMockToken());
  }
} catch {}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const authReact = require("next-auth/react");
  if (authReact && typeof authReact.__resetReactAuthImpls === "function") {
    afterEach(() => authReact.__resetReactAuthImpls());
  }
} catch {}

/* -------------------------------------------------------------------------- */
/* 4.  Silence known noisy console output                                      */
/* -------------------------------------------------------------------------- */

/**
 * Some third-party dependencies emit console noise (for example, JSDOM's
 * navigation warnings or env validation helpers that fail intentionally in
 * tests). Filter specific, known-noisy messages to keep logs readable while
 * preserving all other console output.
 */
type ConsolePattern = string | RegExp;

const JSDOM_NAV_ERROR = "Not implemented: navigation (except hash changes)";

const IGNORED_LOG_PATTERNS: ConsolePattern[] = [
  // Pino JSON logs (level 10=trace, 20=debug, 30=info)
  /^\{"level":(10|20|30),/,
];

const IGNORED_ERROR_PATTERNS: ConsolePattern[] = [
  JSDOM_NAV_ERROR,
  // Service-layer logs exercised in tests
  "Failed to unpublish post",
  "Failed to list media",
  "Inventory patch failed",
  // React dev warnings for DS props on DOM elements
  /React does not recognize the `%s` prop on a DOM element\..*labelClassName/,
  /React does not recognize the `%s` prop on a DOM element\..*trailingIcon/,
  "Failed to load upgrade changes Only absolute URLs are supported",
  // Env validation helpers – these are intentionally exercised with invalid
  // inputs across many suites, so the error logs are expected noise in tests.
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
  // MSW warning for unhandled AI catalog feed preview request in tests
  /\[MSW\] Error: intercepted a request without a matching request handler:.*\/api\/seo\/ai-catalog/,
];

const IGNORED_WARN_PATTERNS: ConsolePattern[] = [
  "⚠️ Invalid payments environment variables",
  // Content readiness audit warnings (expected in content quality tests)
  /ALLOW_EN_FALLBACKS=1 set; found \d+ English strings/,
  /\[WARN\] i18n parity\/quality issues found/,
  /\[WARN\] Guide content parity\/quality issues found/,
  /\[guide-manifest-overrides\] Malformed JSON, using empty defaults/,
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

// Patch the global console so Jest's own console tracking never sees ignored
// messages. Tests that need to assert on console output can still install
// their own spies via `jest.spyOn(console, 'error' | 'warn')`.
(() => {
  const originalConsole = globalThis.console;
  const patchedConsole = Object.create(originalConsole) as Console;

  patchedConsole.log = (...args: unknown[]) => {
    if (shouldIgnoreConsoleMessage(args, IGNORED_LOG_PATTERNS)) return;
    originalConsole.log(...(args as []));
  };

  patchedConsole.error = (...args: unknown[]) => {
    if (shouldIgnoreConsoleMessage(args, IGNORED_ERROR_PATTERNS)) return;
    originalConsole.error(...(args as []));
    // Fail tests on unexpected console.error calls
    throw new Error(`Unexpected console.error in test:\n${args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')}`);
  };

  patchedConsole.warn = (...args: unknown[]) => {
    if (shouldIgnoreConsoleMessage(args, IGNORED_WARN_PATTERNS)) return;
    originalConsole.warn(...(args as []));
    // Fail tests on unexpected console.warn calls
    throw new Error(`Unexpected console.warn in test:\n${args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')}`);
  };

  // eslint-disable-next-line no-console
  globalThis.console = patchedConsole;
})();

if (process.env.JEST_DEBUG_HANDLES === "1") {
  afterAll(() => {
    const getHandles = (process as any)._getActiveHandles?.bind(process);
    const getRequests = (process as any)._getActiveRequests?.bind(process);
    const handles: any[] = getHandles ? getHandles() : [];
    const requests: any[] = getRequests ? getRequests() : [];

    // Surface handle types to help identify open resources keeping Jest alive.
    const handleSummary = handles.map((handle) => {
      const type = handle?.constructor?.name;
      const base = {
        type,
        hasRef: typeof handle?.hasRef === "function" ? handle.hasRef() : undefined,
      };

      if (type === "Timeout") {
        return { ...base, details: { repeat: handle?._repeat, idleTimeout: handle?._idleTimeout } };
      }

      if (type === "Socket") {
        const socket = handle as {
          localAddress?: string;
          localPort?: number;
          remoteAddress?: string;
          remotePort?: number;
          fd?: number;
          readable?: boolean;
          writable?: boolean;
        };
        return {
          ...base,
          details: {
            local: socket.localAddress ? `${socket.localAddress}:${socket.localPort ?? ""}` : undefined,
            remote: socket.remoteAddress
              ? `${socket.remoteAddress}:${socket.remotePort ?? ""}`
              : undefined,
            fd: socket.fd,
            readable: socket.readable,
            writable: socket.writable,
          },
        };
      }

      return base;
    });

    // eslint-disable-next-line no-console
    console.log("JEST_DEBUG_HANDLES active handles:", handleSummary);
    // eslint-disable-next-line no-console
    console.log(
      "JEST_DEBUG_HANDLES active requests:",
      requests.map((req) => req?.constructor?.name),
    );
  });
}
