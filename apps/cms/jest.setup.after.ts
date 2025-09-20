/* -------------------------------------------------------------------------- */
/*  apps/cms/jest.setup.after.ts                                             */
/* -------------------------------------------------------------------------- */
/* eslint-disable no-underscore-dangle */

import "@testing-library/jest-dom";
import "cross-fetch/polyfill";
// Central React/Next polyfills (act, internals, MessageChannel, Response.json)
import "../../test/polyfills/react-compat";
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

// React/Next compat is provided via ../../test/polyfills/react-compat

// JSDOM doesn't implement object URLs. Some hooks rely on these APIs when
// handling file uploads or generating video thumbnails.
if (!(URL as any).createObjectURL) {
  (URL as any).createObjectURL = () => "blob:mock";
}
if (!(URL as any).revokeObjectURL) {
  (URL as any).revokeObjectURL = () => {};
}

// MessageChannel polyfill comes from ../../test/polyfills/react-compat

// Response.json() polyfill is provided centrally via `test/setup-response-json.ts`.

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
