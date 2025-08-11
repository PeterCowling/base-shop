// apps/cms/__tests__/shops.test.ts
/* eslint-env jest */

import type { Session } from "next-auth";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/** Create a temporary repo, run the callback, then restore CWD. */
async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shop-"));
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

afterEach(() => jest.resetAllMocks());

describe("shop actions", () => {
  it("updateShop returns validation errors", async () => {
    await withRepo(async (dir) => {
      /* ──────────────────────────────────────────────────────────────
       *  Seed a minimal shop so getShopById doesn’t throw
       * ──────────────────────────────────────────────────────────── */
      const shopFile = path.join(dir, "data", "shops", "test", "shop.json");
      await fs.writeFile(
        shopFile,
        JSON.stringify(
          {
            id: "test",
            name: "Seed",
            catalogFilters: [],
            themeId: "base",
            themeOverrides: {},
            themeTokens: {},
            filterMappings: {},
            priceOverrides: {},
            localeOverrides: {},
          },
          null,
          2
        )
      );

      /* ----------------------------------------------------------------
       *  Mock an admin session
       * -------------------------------------------------------------- */
      const adminSession = { user: { role: "admin" } } as unknown as Session;

      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue(adminSession),
      }));

      const { updateShop } = await import("../src/actions/shops.server");

      const fd = new FormData();
      fd.append("id", "test");
      fd.append("name", ""); // trigger “Required” validation error
      fd.append("themeId", ""); // trigger “Required” validation error

      const result = await updateShop("test", fd);

      expect(result.errors?.name[0]).toBe("Required");
      expect(result.errors?.themeId[0]).toBe("Required");
    });
  });
});
