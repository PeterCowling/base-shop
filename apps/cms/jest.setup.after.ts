/* -------------------------------------------------------------------------- */
/*  apps/cms/jest.setup.after.ts                                             */
/* -------------------------------------------------------------------------- */
/* eslint-disable no-underscore-dangle */

import "@testing-library/jest-dom";
// Central React/Next polyfills (act, internals, MessageChannel, Response.json)
import "../../test/polyfills/react-compat";
import { configure } from "@testing-library/react";
import React from "react";
import * as ReactDOMTestUtils from "react-dom/test-utils";
import "../../test/polyfills/dom-compat";
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

// React's testing utilities check this flag to verify that the environment
// supports `act()` semantics. Setting it silences act warnings and helps
// React flush updates consistently in tests.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// React/Next compat is provided via ../../test/polyfills/react-compat

// URL/object and DOM stubs are provided via ../../test/polyfills/dom-compat

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
