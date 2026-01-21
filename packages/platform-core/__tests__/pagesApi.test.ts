import fs from "node:fs/promises";
import path from "node:path";

import { NextRequest } from "next/server";

import { mockNextAuthAdmin,withTempRepo } from "@acme/test-utils";

// ts-jest can take a while to compile the first time in CI, so give the tests
// a bit more breathing room.
jest.setTimeout(60_000);

// Response.json() provided by shared test setup

// Use shared repo helper and admin session mock
const withRepo = (cb: (dir: string) => Promise<void>) =>
  withTempRepo(async (dir) => {
    mockNextAuthAdmin();
    await cb(dir);
  }, { prefix: 'pages-api-' });

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
      const res = await GET(new NextRequest("http://localhost"), {
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
      const res = await GET(new NextRequest("http://localhost"), {
        params: { shop: "test" },
      });
      expect(await res.json()).toEqual([]);
    });
  });
});
