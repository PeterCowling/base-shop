// jest.setup.ts
/* eslint-env jest */
/* -------------------------------------------------------------------------- */
/*  Executed **once** before the Jest environment is ready                    */
/* -------------------------------------------------------------------------- */

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
mutableEnv.NEXTAUTH_SECRET ||= "test-nextauth-secret";
mutableEnv.SESSION_SECRET ||= "test-session-secret";
mutableEnv.CMS_SPACE_URL ||= "https://cms.example.com";
mutableEnv.CMS_ACCESS_TOKEN ||= "cms-access-token";
mutableEnv.SANITY_API_VERSION ||= "2023-01-01";

/* -------------------------------------------------------------------------- */
/* 2.  Polyfills missing from the JSDOM / Node test runtime                    */
/* -------------------------------------------------------------------------- */

import "@testing-library/jest-dom";
import "cross-fetch/polyfill";
import React from "react";
import { TextDecoder, TextEncoder } from "node:util";
import { File } from "node:buffer";

// React 19 renamed its internal export used by react‑dom.  Older builds of
// react‑dom still expect `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`,
// while newer builds require
// `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`.  Ensure
// both identifiers point at the same object regardless of which one is present
// so that tests run against either version of React DOM without blowing up.
const OLD_KEY = "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED" as const;
const NEW_KEY =
  "__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE" as const;

if ((React as any)[NEW_KEY] && !(React as any)[OLD_KEY]) {
  (React as any)[OLD_KEY] = (React as any)[NEW_KEY];
} else if ((React as any)[OLD_KEY] && !(React as any)[NEW_KEY]) {
  (React as any)[NEW_KEY] = (React as any)[OLD_KEY];
}

/** Node’s `util` encoders/decoders are required by React-DOM’s server renderer */
(globalThis as any).TextEncoder ||= TextEncoder;
(globalThis as any).TextDecoder ||= TextDecoder;
(globalThis as any).File ||= File;
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
