// jest.setup.ts
/* eslint-env jest */
/* -------------------------------------------------------------------------- */
/*  Executed **once** before the Jest environment is ready                    */
/* -------------------------------------------------------------------------- */

import { jest } from "@jest/globals";
jest.mock("@prisma/client");

/* -------------------------------------------------------------------------- */
/* 1.  Environment variables expected by the app while running tests          */
/* -------------------------------------------------------------------------- */

/**
 * In @types/node ≥ 22 every key in `process.env` is marked `readonly`,
 * so direct assignment (`process.env.NODE_ENV = …`) now fails with
 * TS 2540.
 * We work around that by first casting to a mutable record.
 */
const mutableEnv = process.env as unknown as Record<string, string>;

mutableEnv.NODE_ENV ||= "development"; // relax “edge” runtime checks
mutableEnv.CART_COOKIE_SECRET ||= "test-cart-secret"; // cart cookie signing
mutableEnv.STRIPE_WEBHOOK_SECRET ||= "whsec_test"; // dummy Stripe webhook secret
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
mutableEnv.EMAIL_PROVIDER ||= "noop";

/* -------------------------------------------------------------------------- */
/* 2.  Polyfills missing from the JSDOM / Node test runtime                    */
/* -------------------------------------------------------------------------- */

import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";
configure({ testIdAttribute: "data-cy" });
import "cross-fetch/polyfill";
import React from "react";
import { TextDecoder, TextEncoder } from "node:util";
import { File } from "node:buffer";
import { webcrypto } from "node:crypto";

// React 19's experimental builds may not yet expose a built‑in `act` helper.
// Testing libraries still expect `React.act` to exist, so provide a minimal
// fallback that awaits the callback and returns a thenable.
if (!(React as any).act) {
  (React as any).act = (callback: () => void | Promise<void>) => {
    const result = callback();
    return result && typeof (result as any).then === "function"
      ? result
      : Promise.resolve(result);
  };
}

// React 19 renamed its internal export used by react‑dom.  Depending on which
// version of React/React‑DOM is installed, either the old `__SECRET_INTERNALS…`
// or the new `__CLIENT_INTERNALS…` may be missing.  Alias whichever one is
// absent so that both names resolve to the same object.
if (
  (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE &&
  !(React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
) {
  (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED =
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
} else if (
  (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED &&
  !(React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
) {
  (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
    (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
}

/** Node’s `util` encoders/decoders are required by React-DOM’s server renderer */
(globalThis as any).TextEncoder ||= TextEncoder;
(globalThis as any).TextDecoder ||= TextDecoder;
(globalThis as any).File ||= File;
(globalThis as any).crypto ||= webcrypto;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { File: UndiciFile, FormData: UndiciFormData } = require("undici");
(globalThis as any).File ||= UndiciFile;
// Use JSDOM's FormData/File when available so form submissions work in tests
if (typeof window !== "undefined") {
  (globalThis as any).FormData = window.FormData;
  (globalThis as any).File = window.File;
} else {
  (globalThis as any).FormData ||= UndiciFormData;
}

/** JSDOM doesn't implement object URLs; stub the APIs used in tests */
if (!(URL as any).createObjectURL) {
  (URL as any).createObjectURL = () => "blob:mock";
}
if (!(URL as any).revokeObjectURL) {
  (URL as any).revokeObjectURL = () => {};
}

// JSDOM lacks certain DOM APIs used by Radix UI components
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (
  typeof HTMLElement !== "undefined" &&
  !HTMLElement.prototype.hasPointerCapture
) {
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => {};
  HTMLElement.prototype.releasePointerCapture = () => {};
}

/**
 * React 19+ uses `MessageChannel` internally for suspense & streaming.
 * Node’s impl can leave ports open, preventing Jest from exiting, so
 * a lightweight stub is installed via `test/polyfills/messageChannel.js`.
 */

/**
 * Next 15 occasionally calls the *static* helper `Response.json()`, which
 * has not yet landed in Node’s WHATWG `Response` implementation.  We shim
 * it here so route-handler tests don’t blow up.
 */
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (
    data: unknown,
    init: ResponseInit | number = {}
  ): Response => {
    const opts: ResponseInit =
      typeof init === "number" ? { status: init } : init;

    const headers = new Headers(opts.headers);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return new Response(JSON.stringify(data), { ...opts, headers });
  };
}

/* -------------------------------------------------------------------------- */
/* 3.  MSW (Mock Service Worker) – network stubbing for API calls             */
/* -------------------------------------------------------------------------- */

import { server } from "./test/msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
