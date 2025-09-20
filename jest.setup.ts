// jest.setup.ts
/* eslint-env jest */
/* -------------------------------------------------------------------------- */
/*  Executed **once** before the Jest environment is ready                    */
/* -------------------------------------------------------------------------- */

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

mutableEnv.NODE_ENV ||= "development"; // relax “edge” runtime checks
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

// React/Next + DOM polyfills are provided via test/polyfills/*

/**
 * React 19+ uses `MessageChannel` internally for suspense & streaming.
 * Node’s impl can leave ports open, preventing Jest from exiting, so
 * a lightweight stub is installed via `test/polyfills/messageChannel.js`.
 */

// Response.json() polyfill is provided centrally via `test/setup-response-json.ts`.

/* -------------------------------------------------------------------------- */
/* 3.  MSW (Mock Service Worker) – network stubbing for API calls             */
/* -------------------------------------------------------------------------- */

import { server } from "./test/msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
