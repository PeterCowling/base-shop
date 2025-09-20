/* ---------------------------------------------------------------------- */
/* apps/cms/__tests__/seo-revert.test.ts                                   */
/* ---------------------------------------------------------------------- */
/* eslint-disable import/first */

(process.env as Record<string, string>).NODE_ENV = "development";

import fs from "node:fs/promises";
import path from "node:path";
import "../src/types/next-auth.d.ts";
import { withTempRepo } from "@acme/test-utils";

jest.setTimeout(120_000);

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

const withRepo = (cb: (dir: string) => Promise<void>) =>
  withTempRepo(cb, { prefix: 'seo-' });

/** Stub `getServerSession` so the action layer sees an admin user. */
import { __setMockSession } from "next-auth";
function mockAuth(): void {
  __setMockSession({ user: { role: "admin" } } as any);
}

/* ---------------------------------------------------------------------- */
/* Tests                                                                  */
/* ---------------------------------------------------------------------- */

describe("SEO revert via timeline", () => {
  afterEach(() => jest.resetAllMocks());

  it("reverts settings and records history", async () => {
    await withRepo(async (dir) => {
      mockAuth();
      jest.doMock("next/cache", () => ({ revalidatePath: jest.fn() }));

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
