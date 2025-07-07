/* -------------------------------------------------------------------------- */
/*  apps/cms/jest.setup.ts                                                    */
/* -------------------------------------------------------------------------- */
/* eslint-disable no-underscore-dangle */

import "@testing-library/jest-dom";
import "cross-fetch/polyfill";
import { TextDecoder, TextEncoder } from "node:util";

/* -------------------------------------------------------------------------- */
/* 1 ·  ENVIRONMENT VARIABLES                                                 */
/* -------------------------------------------------------------------------- */

Object.assign(process.env, {
  NODE_ENV: "test", // make it explicit
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "test-secret",
});

/* -------------------------------------------------------------------------- */
/* 2 ·  GLOBAL POLYFILLS & SHIMS                                              */
/* -------------------------------------------------------------------------- */

/** Promote WHATWG encoders/decoders so libraries can rely on them */
(globalThis as any).TextEncoder ||= TextEncoder;
(globalThis as any).TextDecoder ||= TextDecoder;

/**
 * React 19’s scheduler uses MessageChannel.  A lightweight stub keeps Jest from
 * reporting “open handles” without touching Node’s real implementation.
 */
class StubPort {
  onmessage: ((e: MessageEvent) => void) | null = null;
  postMessage = jest.fn<void, [unknown]>();
  close = jest.fn<void, []>();
  start = jest.fn<void, []>();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}
(globalThis as any).MessageChannel ||= class {
  readonly port1 = new StubPort();
  readonly port2 = new StubPort();
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

jest.mock("next/image", () => ({
  __esModule: true,
  /* eslint-disable react/display-name */
  default: (props: any) => <img {...props} />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    // the link wrapper must return an <a> so @testing-library can query it
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

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

/* -------------------------------------------------------------------------- */
/* 3 ·  MSW – Mock Service Worker                                             */
/* -------------------------------------------------------------------------- */

import { server } from "../../test/mswServer";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
