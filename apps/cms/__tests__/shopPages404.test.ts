// apps/cms/__tests__/shopPages404.test.ts
/* eslint-env jest */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Some pages pull in heavy server-only modules which can slow down
// the initial dynamic import. Increase the Jest timeout so each
// route test has enough time to complete without failing.
jest.setTimeout(20_000);

/** Spin up an isolated repo in /tmp, run the callback, then restore CWD. */
async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "repo-"));
  await fs.mkdir(path.join(dir, "data", "shops"), { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

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
      jest.doMock("next-auth", () => ({ getServerSession: jest.fn() }));

      // media route pulls in server-only helpers — stub them completely
      jest.doMock("@cms/actions/media", () => ({
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
