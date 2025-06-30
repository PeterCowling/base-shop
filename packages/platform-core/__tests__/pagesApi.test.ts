import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// NextResponse.json relies on the static Response.json helper which isn't
// provided by the fetch polyfill used by JSDOM. Add a minimal shim so the
// route can construct JSON responses during tests.
if (typeof (Response as any).json !== "function") {
  (Response as any).json = function json(
    body: unknown,
    init?: ResponseInit
  ): Response {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  };
}

/** Creates a temp repo, runs cb, then restores CWD */
async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pages-api-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("pages API route", () => {
  it("returns seeded pages", async () => {
    await withRepo(async (dir) => {
      const pages = [
        {
          id: "1",
          slug: "home",
          status: "draft",
          components: [],
          seo: { title: "Home" },
          createdAt: "t",
          updatedAt: "t",
          createdBy: "tester",
        } as any,
      ];
      await fs.writeFile(
        path.join(dir, "data", "shops", "test", "pages.json"),
        JSON.stringify(pages),
        "utf8"
      );

      const { GET } = await import(
        "../../../apps/cms/src/app/api/pages/[shop]/route"
      );
      const res = await GET(new Request("http://localhost"), {
        params: { shop: "test" },
      });
      expect(await res.json()).toEqual(pages);
    });
  });

  it("returns empty array when file missing", async () => {
    await withRepo(async () => {
      const { GET } = await import(
        "../../../apps/cms/src/app/api/pages/[shop]/route"
      );
      const res = await GET(new Request("http://localhost"), {
        params: { shop: "test" },
      });
      expect(await res.json()).toEqual([]);
    });
  });
});
