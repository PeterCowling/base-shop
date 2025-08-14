import { jest } from "@jest/globals";
import { createHmac } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { nowIso } from "@date-utils";

import type { Page } from "@acme/types";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

async function withRepo(
  cb: (
    repo: typeof import("@platform-core/repositories/pages")
  ) => Promise<void>
) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pages-"));
  await fs.mkdir(path.join(dir, "data", "shops", "demo"), { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  const repoPath = path.join(
    __dirname,
    "../../..",
    "packages",
    "platform-core",
    "repositories",
    "pages",
    "index.server"
  );
  const repo = await import(repoPath);
  jest.doMock("@platform-core/repositories/pages", () => ({
    __esModule: true,
    ...repo,
  }));
  try {
    await cb(repo);
  } finally {
    process.chdir(cwd);
  }
}

function tokenFor(id: string): string {
  return createHmac("sha256", "secret").update(id).digest("hex");
}

describe("CMS → storefront flow", () => {
  beforeAll(() => {
    process.env.PREVIEW_TOKEN_SECRET = "secret";
    process.env.NEXT_PUBLIC_SHOP_ID = "demo";
  });

  test("published page is returned via preview route", async () => {
    await withRepo(async (repo) => {
      const now = nowIso();
      const page: Page = {
        id: "p1",
        slug: "home",
        status: "draft",
        components: [{ id: "c1", type: "HeroBanner" }],
        seo: { title: "Home" },
        createdAt: now,
        updatedAt: now,
        createdBy: "tester",
      };
      await repo.savePage("demo", page, undefined);
      await repo.updatePage(
        "demo",
        {
          id: page.id,
          updatedAt: page.updatedAt,
          status: "published",
        } as any,
        page as any
      );

      const { onRequest } = await import("../src/routes/preview/[pageId].ts");
      const res = await onRequest({
        params: { pageId: "p1" },
        request: new Request(`http://test?token=${tokenFor("p1")}`),
      } as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("published");
      expect(body.id).toBe("p1");
    });
  });
});
