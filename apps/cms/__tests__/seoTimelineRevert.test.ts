/* ---------------------------------------------------------------------- */
/* apps/cms/__tests__/seo-revert.test.ts                                   */
/* ---------------------------------------------------------------------- */
/* eslint-disable import/first */

(process.env as Record<string, string>).NODE_ENV = "development";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import "../src/types/next-auth.d.ts";

/* ---------------------------------------------------------------------- */
/* Helper types — kept tiny & local to this test                          */
/* ---------------------------------------------------------------------- */

interface SeoSettings {
  [locale: string]: {
    title?: string;
    description?: string;
  };
}

interface ShopSettings {
  seo: SeoSettings;
}

/* ---------------------------------------------------------------------- */
/* Utility helpers                                                        */
/* ---------------------------------------------------------------------- */

/** Create an isolated temp repository, run the callback, then restore CWD. */
async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "seo-"));
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

/** Stub `getServerSession` so the action layer sees an admin user. */
function mockAuth(): void {
  jest.doMock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
  }));
}

/* ---------------------------------------------------------------------- */
/* Tests                                                                  */
/* ---------------------------------------------------------------------- */

describe("SEO revert via timeline", () => {
  afterEach(() => jest.resetAllMocks());

  it("reverts settings and records history", async () => {
    await withRepo(async (dir) => {
      mockAuth();

      // Dynamic imports must come *after* jest.doMock + cwd swap
      const actions = await import("../src/actions/shops.server");
      const repo = await import(
        "@acme/platform-core/repositories/settings.server"
      );

      /* ---------- initial update -------------------------------------- */
      const fd = new FormData();
      fd.append("locale", "en");
      fd.append("title", "Hello");

      await actions.updateSeo("test", fd);

      /* ---------- inspect history ------------------------------------- */
      const history = await repo.diffHistory("test");
      expect(history).toHaveLength(1);
      const ts = history[0].timestamp;

      /* ---------- verify settings saved ------------------------------- */
      const settingsFile = path.join(
        dir,
        "data",
        "shops",
        "test",
        "settings.json"
      );
      const settings = JSON.parse(
        await fs.readFile(settingsFile, "utf8")
      ) as ShopSettings;

      expect(settings.seo.en.title).toBe("Hello");

      /* ---------- perform revert -------------------------------------- */
      await actions.revertSeo("test", ts);

      const reverted = JSON.parse(
        await fs.readFile(settingsFile, "utf8")
      ) as ShopSettings;
      expect(reverted.seo).toEqual({});

      /* ---------- ensure new history line appended -------------------- */
      const historyFile = path.join(
        dir,
        "data",
        "shops",
        "test",
        "settings.history.jsonl"
      );
      const lines = (await fs.readFile(historyFile, "utf8"))
        .trim()
        .split(/\n+/);

      expect(lines).toHaveLength(2);

      const last = JSON.parse(lines[1]) as { diff: Partial<ShopSettings> };
      expect(last.diff.seo).toEqual({});
    });
  });
});
