// jest.setup.ts  –  executed **once** before the Jest environment is ready
/* eslint-disable no-underscore-dangle */

/* -------------------------------------------------------------------------- */
/* 1.  Environment variables expected by the app while running tests          */
/* -------------------------------------------------------------------------- */

// Pretend we are in dev-mode so “edge” runtimes, etc. relax restrictions
process.env.NODE_ENV = "development";

// A dummy secret so Next-Auth initialisation never bails out
process.env.NEXTAUTH_SECRET ??= "test-secret";

/* -------------------------------------------------------------------------- */
/* 2.  Polyfills missing from the JSDOM / Node test runtime                    */
/* -------------------------------------------------------------------------- */

import "@testing-library/jest-dom";
import "cross-fetch/polyfill";
import { TextDecoder, TextEncoder } from "node:util";
import { MessageChannel } from "node:worker_threads";

/** `util` gives us encoders/decoders that React-DOM’s server renderer expects */
(globalThis as any).TextEncoder ||= TextEncoder;
(globalThis as any).TextDecoder ||= TextDecoder;

/** React 19+ uses `MessageChannel` internally for suspense & streaming */
(globalThis as any).MessageChannel ||= MessageChannel;

/**
 * Next 15 sometimes calls the *static* convenience helper `Response.json()`
 * which isn’t yet in the WHATWG spec implementation that ships with Node.
 * We shim it here so route-handler tests don’t blow up.
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

import { server } from "./test/mswServer";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
