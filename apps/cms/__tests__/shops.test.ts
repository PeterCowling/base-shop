import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/** Creates a temp repo, runs cb, then restores CWD */
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
    await withRepo(async () => {
      jest.doMock("next-auth", () => ({
        getServerSession: jest
          .fn()
          .mockResolvedValue({ user: { role: "admin" } }),
      }));

      const { updateShop } = await import("../src/actions/shops.server");

      const fd = new FormData();
      fd.append("id", "test");
      fd.append("name", "");
      fd.append("themeId", "");

      const result = await updateShop("test", fd);
      expect(result.errors?.name[0]).toBe("Required");
      expect(result.errors?.themeId[0]).toBe("Required");
    });
  });
});
