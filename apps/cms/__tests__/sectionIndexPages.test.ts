import fs from "node:fs/promises";
import path from "node:path";
import { withTempRepo } from "@acme/test-utils";

// Some pages pull in heavy server-only modules which can slow down
// the initial dynamic import. Increase the Jest timeout so the test has
// enough time to complete without failing.
jest.setTimeout(20_000);

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement("a", { href: props.href }, props.children),
  };
});

const withRepo = (cb: (dir: string) => Promise<void>) =>
  withTempRepo(async (dir) => {
    const shopsDir = path.join(dir, 'data', 'shops');
    await fs.mkdir(path.join(shopsDir, 'foo'), { recursive: true });
    await fs.mkdir(path.join(shopsDir, 'bar'), { recursive: true });
    await cb(dir);
  }, { prefix: 'sections-', createShopDir: false });

describe("CMS section index pages", () => {
  it("lists shops with links", async () => {
    await withRepo(async () => {
      await import("react");
      const { renderToStaticMarkup } = await import("react-dom/server");
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
      await import("react");
      const { renderToStaticMarkup } = await import("react-dom/server");
      const { default: Page } = await import("../src/app/cms/products/page");
      const html = renderToStaticMarkup(await Page());
      expect(html).toContain("No shops found.");
    });
  });
});
