// apps/cms/jest.setup.ts
/* eslint-disable no-underscore-dangle */

/* -------------------------------------------------------------------------- */
/* 1.  Environment variables expected by the app while running the tests      */
/* -------------------------------------------------------------------------- */
/**
 * `ProcessEnv` is now typed as *readonly*. Mutating via Object.assign avoids
 * TS2540 while still patching the live `process.env` object.
 */
Object.assign(process.env, {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "test-secret",
});

/* -------------------------------------------------------------------------- */
/* 2.  Polyfills missing from the JSDOM / Node test runtime                   */
/* -------------------------------------------------------------------------- */

import "@testing-library/jest-dom";
import "cross-fetch/polyfill";
import { TextDecoder, TextEncoder } from "node:util";
import { MessageChannel } from "node:worker_threads";

/** Node provides WHATWG encoders/decoders we can promote to global scope */
(globalThis as any).TextEncoder ||= TextEncoder;
(globalThis as any).TextDecoder ||= TextDecoder;

/**
 * React 19+ uses `MessageChannel` for its scheduler. Exposing Node’s
 * implementation here prevents the multiple‑port “open handle” warnings that
 * otherwise appear at the end of test runs.:contentReference[oaicite:1]{index=1}
 */
(globalThis as any).MessageChannel ||= MessageChannel;

/**
 * Next 15 sometimes calls the static helper `Response.json()`, which has not
 * yet landed in Node’s built‑in WHATWG implementation.  A minimal shim keeps
 * route‑handler tests from crashing.
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
/* 3.  MSW (Mock Service Worker) – network stubbing for API calls             */
/* -------------------------------------------------------------------------- */

import { server } from "../../test/mswServer";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
