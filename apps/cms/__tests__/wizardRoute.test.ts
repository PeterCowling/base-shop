/* eslint-env jest */

import { TextDecoder, TextEncoder } from "node:util";
import { MessageChannel } from "node:worker_threads";
import { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Polyfills                                                         */
/* ------------------------------------------------------------------ */

(globalThis as any).MessageChannel = MessageChannel;
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;

/* ------------------------------------------------------------------ */
/*  Environment setup                                                 */
/* ------------------------------------------------------------------ */

process.env.NEXTAUTH_SECRET = "test-secret";

/* ------------------------------------------------------------------ */
/*  External-module stubs                                             */
/* ------------------------------------------------------------------ */

/** Replace hook-using providers with inert fragments for SSR tests */
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

/** Pretend an admin session is always present */
jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));

/** Silence real navigations */
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

/* ------------------------------------------------------------------ */
/*  Test                                                              */
/* ------------------------------------------------------------------ */

describe("wizard route", () => {
  it("renders wizard page for admin", async () => {
    jest.resetModules(); // ensure mocks are applied fresh
    await import("../../../test/resetNextMocks");

    const { renderToStaticMarkup } = await import("react-dom/server");
    const { default: WizardPage } = await import("../src/app/cms/wizard/page");

    const html = renderToStaticMarkup(await WizardPage());

    // First step heading should be present in the static markup
    expect(html).toContain("Shop Details");
  });
});
