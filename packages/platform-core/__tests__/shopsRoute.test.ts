import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

jest.mock("@cms/actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue(undefined),
}));

/** Creates a temp dir, runs cb, restores CWD */
async function withTmpRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shops-api-"));
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

describe("GET /api/shops", () => {
  it("lists shop directories", async () => {
    await withTmpRepo(async (dir) => {
      const shopsDir = path.join(dir, "data", "shops");
      await fs.mkdir(path.join(shopsDir, "shop1"), { recursive: true });
      await fs.mkdir(path.join(shopsDir, "shop2"));

      const { GET } = await import("../../../apps/cms/src/app/api/shops/route");
      const res = await GET();
      expect(await res.json()).toEqual(
        expect.arrayContaining(["shop1", "shop2"])
      );
    });
  });

  it("returns empty array when directory empty", async () => {
    await withTmpRepo(async (dir) => {
      await fs.mkdir(path.join(dir, "data", "shops"), { recursive: true });

      const { GET } = await import("../../../apps/cms/src/app/api/shops/route");
      const res = await GET();
      expect(await res.json()).toEqual([]);
    });
  });

  it("returns empty array when directory missing", async () => {
    await withTmpRepo(async () => {
      const { GET } = await import("../../../apps/cms/src/app/api/shops/route");
      const res = await GET();
      expect(await res.json()).toEqual([]);
    });
  });
});
