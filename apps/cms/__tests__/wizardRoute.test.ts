// apps/cms/__tests__/wizardRoute.test.ts
/* eslint-env jest */

import { TextDecoder, TextEncoder } from "node:util";
import { MessageChannel } from "node:worker_threads";
import { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Polyfills & globals                                                       */
/* -------------------------------------------------------------------------- */

(globalThis as any).MessageChannel = MessageChannel;
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;

/* -------------------------------------------------------------------------- */
/*  Environment                                                               */
/* -------------------------------------------------------------------------- */

process.env.NEXTAUTH_SECRET = "test-secret";

/* -------------------------------------------------------------------------- */
/*  External-module stubs                                                     */
/* -------------------------------------------------------------------------- */

/**
 * @platform-core/src exports React providers that call hooks.  For a
 * server-side render test we can replace them with no-op fragments.  Importing
 * React inside the factory (via `require`) keeps the mock valid in both CJS
 * and ESM Jest runs.
 */
jest.mock("@platform-core/src", () => {
  const React = require("react");
  return {
    __esModule: true,
    LayoutProvider: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    ThemeProvider: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useLayout: () => ({}),
  };
});

/* Stub auth/session so the wizard route behaves as if an admin is logged in */
jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));

/* Stub `redirect` to prevent actual navigation */
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

/* -------------------------------------------------------------------------- */
/*  Test                                                                      */
/* -------------------------------------------------------------------------- */

describe("wizard route", () => {
  it("renders wizard page for admin", async () => {
    jest.resetModules(); // ensure fresh import with mocks applied

    const { renderToStaticMarkup } = await import("react-dom/server");
    const { default: WizardPage } = await import("../src/app/cms/wizard/page");

    const html = renderToStaticMarkup(await WizardPage());
    expect(html).toContain("Create Shop");
  });
});
