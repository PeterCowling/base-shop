/** @jest-environment node */
/* eslint-env jest */

import React, { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Environment setup                                                 */
/* ------------------------------------------------------------------ */

process.env.NEXTAUTH_SECRET = "test-secret";

/* ------------------------------------------------------------------ */
/*  External-module stubs                                             */
/* ------------------------------------------------------------------ */

/** Replace hook-using providers with inert fragments for SSR tests */
jest.mock("@platform-core", () => {
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
  it("redirects to the configurator", async () => {
    jest.resetModules();
    await import("../../../test/resetNextMocks");
    const { redirect } = await import("next/navigation");
    const { default: WizardPage } = await import("../src/app/cms/wizard/page");

    await WizardPage();

    expect(redirect).toHaveBeenCalledWith("/cms/configurator");
  });
});
