// apps/cms/__tests__/shopPages404.test.ts
/* eslint-env jest */
import fs from "node:fs/promises";
import path from "node:path";
import { withTempRepo } from "@acme/test-utils";

// Some pages pull in heavy server-only modules which can slow down
// the initial dynamic import. Increase the Jest timeout so each
// route test has enough time to complete without failing.
// Allow additional time for dynamic imports of Next.js server routes
jest.setTimeout(60_000);

/** Spin up an isolated repo in /tmp, run the callback, then restore CWD. */
const withRepo = (cb: (dir: string) => Promise<void>) =>
  withTempRepo(cb, { prefix: 'repo-' });

afterEach(() => jest.resetAllMocks());

describe("CMS shop pages", () => {
  const routes: string[] = [
    "../src/app/cms/shop/[shop]/page",
    "../src/app/cms/shop/[shop]/products/page",
    "../src/app/cms/shop/[shop]/pages/page",
    "../src/app/cms/shop/[shop]/media/page",
    "../src/app/cms/shop/[shop]/settings/page",
  ];

  it.each(routes)("returns 404 for %s when shop missing", async (route) => {
    await withRepo(async () => {
      // ────────────────────────────────────────────────────────────────
      //  Mocks that *must* exist before the dynamic import below
      // ────────────────────────────────────────────────────────────────
      const notFound = jest.fn(() => {
        throw new Error("NF");
      });

      jest.doMock("next/navigation", () => ({ notFound }));
      // Ensure an unauthenticated session via central mock
      const { __setMockSession } = require('next-auth') as { __setMockSession: (s: any) => void };
      __setMockSession(null);

      // media route pulls in server-only helpers — stub them completely
      jest.doMock("@cms/actions/media.server", () => ({
        listMedia: jest.fn(),
        deleteMedia: jest.fn(),
      }));

      // products page imports heavy server-only actions; mock them as well
      jest.doMock("@cms/actions/products.server", () => ({
        createDraft: jest.fn(),
        deleteProduct: jest.fn(),
        duplicateProduct: jest.fn(),
      }));

      // settings page imports auth options and shop actions; keep them light
      jest.doMock("@cms/auth/options", () => ({}));
      jest.doMock("@cms/actions/shops.server", () => ({
        resetThemeOverride: jest.fn(),
      }));

      // dynamic import of the page under test
      const mod = await import(route);
      const Page = mod.default as (args: {
        params: Promise<{ shop: string }>;
      }) => Promise<unknown>;

      await expect(
        Page({ params: Promise.resolve({ shop: "unknown" }) })
      ).rejects.toThrow("NF");

      expect(notFound).toHaveBeenCalled();
    });
  });
});
