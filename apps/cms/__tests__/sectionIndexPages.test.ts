import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Some pages pull in heavy server-only modules which can slow down
// the initial dynamic import. Increase the Jest timeout so the test has
// enough time to complete without failing.
jest.setTimeout(20_000);

jest.mock("next/link", () => ({
  __esModule: true,
  default: (props: any) =>
    React.createElement("a", { href: props.href }, props.children),
}));

async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sections-"));
  const shopsDir = path.join(dir, "data", "shops");
  await fs.mkdir(path.join(shopsDir, "foo"), { recursive: true });
  await fs.mkdir(path.join(shopsDir, "bar"), { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("CMS section index pages", () => {
  it("lists shops with links", async () => {
    await withRepo(async () => {
      const sections = [
        ["products", "products"],
        ["pages", "pages"],
        ["media", "media"],
      ] as const;

      for (const [folder, route] of sections) {
        const { default: Page } = await import(`../src/app/cms/${folder}/page`);
        const html = renderToStaticMarkup(await Page());
        expect(html).toContain(`/cms/shop/foo/${route}`);
        expect(html).toContain(`/cms/shop/bar/${route}`);
        expect(html).not.toContain("No shops found.");
      }
    });
  });

  it("shows message when no shops exist", async () => {
    await withRepo(async (dir) => {
      await fs.rm(path.join(dir, "data", "shops", "foo"), {
        recursive: true,
        force: true,
      });
      await fs.rm(path.join(dir, "data", "shops", "bar"), {
        recursive: true,
        force: true,
      });
      const { default: Page } = await import("../src/app/cms/products/page");
      const html = renderToStaticMarkup(await Page());
      expect(html).toContain("No shops found.");
    });
  });
});
