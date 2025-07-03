(process.env as Record<string, string>).NODE_ENV = "development";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import "../src/types/next-auth.d.ts";

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

function mockAuth() {
  jest.doMock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
  }));
}

describe("SEO revert via timeline", () => {
  afterEach(() => jest.resetAllMocks());

  it("reverts settings and records history", async () => {
    await withRepo(async (dir) => {
      mockAuth();
      const actions = await import("../src/actions/shops.server");
      const repo = await import(
        "../../../packages/platform-core/repositories/settings.server"
      );

      const fd = new FormData();
      fd.append("locale", "en");
      fd.append("title", "Hello");
      await actions.updateSeo("test", fd);

      let history = await repo.diffHistory("test");
      expect(history).toHaveLength(1);
      const ts = history[0].timestamp;

      const settingsFile = path.join(
        dir,
        "data",
        "shops",
        "test",
        "settings.json"
      );
      let settings = JSON.parse(await fs.readFile(settingsFile, "utf8"));
      expect(settings.seo.en.title).toBe("Hello");

      await actions.revertSeo("test", ts);

      settings = JSON.parse(await fs.readFile(settingsFile, "utf8"));
      expect(settings.seo).toEqual({});

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
      const last = JSON.parse(lines[1]);
      expect(last.diff.seo).toEqual({});
    });
  });
});
