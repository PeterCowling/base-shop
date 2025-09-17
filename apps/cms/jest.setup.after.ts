/* -------------------------------------------------------------------------- */
/*  apps/cms/jest.setup.after.ts                                             */
/* -------------------------------------------------------------------------- */
/* eslint-disable no-underscore-dangle */

import "@testing-library/jest-dom";
import "cross-fetch/polyfill";
import { configure } from "@testing-library/react";
import React from "react";
import * as ReactDOMTestUtils from "react-dom/test-utils";
import { TextDecoder, TextEncoder } from "node:util";
import "./__tests__/mocks/external";
import "../../test/resetNextMocks";
import "../../test/polyfills/form-request-submit";

configure({ testIdAttribute: "data-cy" });

/* -------------------------------------------------------------------------- */
/* 1 ·  ENVIRONMENT VARIABLES                                                 */
/* -------------------------------------------------------------------------- */

Object.assign(process.env, {
  NODE_ENV: "test", // make it explicit
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "sk_test",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "pk_test",
});


/* -------------------------------------------------------------------------- */
/* 2 ·  GLOBAL POLYFILLS & SHIMS                                              */
/* -------------------------------------------------------------------------- */

/** Promote WHATWG encoders/decoders so libraries can rely on them */
(globalThis as any).TextEncoder ||= TextEncoder;
(globalThis as any).TextDecoder ||= TextDecoder;

// React's testing utilities check this flag to verify that the environment
// supports `act()` semantics. Setting it silences act warnings and helps
// React flush updates consistently in tests.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// React 19 may not expose a global `act` helper yet. Testing libraries expect
// `React.act` to exist, so provide a minimal async-aware stub when missing.
if (!(React as any).act) {
  (React as any).act = (callback: () => void | Promise<void>) => {
    const result = callback();
    return result && typeof (result as any).then === "function"
      ? result
      : Promise.resolve(result);
  };
}

// Ensure `react-dom/test-utils` exposes an `act` helper. Newer React canaries
// sometimes omit this export, so fall back to the `React.act` stub above.
if (!(ReactDOMTestUtils as any).act) {
  (ReactDOMTestUtils as any).act = (React as any).act;
}

// React 19 renamed an internal export used by react-dom. Depending on the
// exact canary build, either the old `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`
// or the new `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
// may be missing. Expose whichever alias is absent so test utilities relying on
// these internals continue to work.
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

// JSDOM doesn't implement object URLs. Some hooks rely on these APIs when
// handling file uploads or generating video thumbnails.
if (!(URL as any).createObjectURL) {
  (URL as any).createObjectURL = () => "blob:mock";
}
if (!(URL as any).revokeObjectURL) {
  (URL as any).revokeObjectURL = () => {};
}

/**
 * React 19’s scheduler uses MessageChannel.  A lightweight stub keeps Jest from
 * reporting “open handles” without touching Node’s real implementation.
 */
class StubPort {
  onmessage: ((e: MessageEvent) => void) | null = null;
  other?: StubPort;
  postMessage = jest.fn((data: unknown) => {
    queueMicrotask(() => this.other?.onmessage?.({ data } as MessageEvent));
  });
  close = jest.fn<void, []>();
  start = jest.fn<void, []>();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}

(globalThis as any).MessageChannel = class {
  readonly port1: StubPort;
  readonly port2: StubPort;

  constructor() {
    this.port1 = new StubPort();
    this.port2 = new StubPort();
    this.port1.other = this.port2;
    this.port2.other = this.port1;
  }
};

/**
 * Next 15 sometimes calls the static helper `Response.json()`, which Node
 * doesn’t have yet.  A minimal shim prevents route-handler tests from crashing.
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
/* 2b ·  LIGHTWEIGHT NEXT.JS MOCKS FOR JSDOM                                  */
/* -------------------------------------------------------------------------- */

// Reset Next.js-specific components to lightweight JSDOM-compatible mocks.
// See `test/resetNextMocks.ts` for implementation details.

jest.mock("next/router", () => ({
  __esModule: true,
  useRouter: () => ({
    pathname: "/",
    query: {},
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

