import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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
  const pages = [
    "../src/app/cms/shop/[shop]/page",
    "../src/app/cms/shop/[shop]/products/page",
    "../src/app/cms/shop/[shop]/pages/page",
    "../src/app/cms/shop/[shop]/media/page",
    "../src/app/cms/shop/[shop]/settings/page",
  ];

  it.each(pages)("returns 404 for %s when shop missing", async (route) => {
    await withRepo(async () => {
      const notFound = jest.fn(() => {
        throw new Error("NF");
      });
      jest.doMock("next/navigation", () => ({ notFound }));
      jest.doMock("next-auth", () => ({ getServerSession: jest.fn() }));
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
