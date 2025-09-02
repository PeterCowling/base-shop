import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { LOCALES } from "@acme/i18n/locales";

jest.mock("@acme/date-utils", () => ({ nowIso: jest.fn(() => "2000-01-01T00:00:00.000Z") }));

jest.setTimeout(20_000);

async function withRepo(
  cb: (
    repo: typeof import("../src/repositories/settings.server"),
    shop: string,
    dir: string
  ) => Promise<void>
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "settings-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  const repo = await import("../src/repositories/settings.server");
  try {
    await cb(repo, "test", dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("settings repository", () => {
  it("reads existing settings and merges defaults", async () => {
    await withRepo(async (repo, shop, dir) => {
      const file = path.join(dir, "data", "shops", shop, "settings.json");
      await fs.writeFile(
        file,
        JSON.stringify({
          languages: ["en"],
          seo: {},
          updatedAt: "",
          updatedBy: "",
          currency: "USD",
          stockAlert: { recipients: ["a@example.com"] },
        }),
        "utf8"
      );
      const settings = await repo.getShopSettings(shop);
      expect(settings.currency).toBe("USD");
      expect(settings.languages).toEqual(["en"]);
      expect(settings.depositService).toEqual({ enabled: false, intervalMinutes: 60 });
      expect(settings.stockAlert.recipients).toEqual(["a@example.com"]);
      expect(settings.freezeTranslations).toBe(false);
    });
  });

  it("returns defaults when read fails", async () => {
    await withRepo(async (repo, shop) => {
      jest
        .spyOn(fs, "readFile")
        .mockRejectedValueOnce(new Error("fail"));
      const settings = await repo.getShopSettings(shop);
      expect(settings.currency).toBe("EUR");
      expect(settings.languages).toEqual(LOCALES);
    });
  });

  it("saveShopSettings writes tmp file and history entry", async () => {
    await withRepo(async (repo, shop, dir) => {
      const writeSpy = jest.spyOn(fs, "writeFile");
      const renameSpy = jest.spyOn(fs, "rename");
      const appendSpy = jest.spyOn(fs, "appendFile");

      const initial = await repo.getShopSettings(shop);
      const updated = { ...initial, currency: "USD" };
      await repo.saveShopSettings(shop, updated);

      expect(writeSpy).toHaveBeenCalled();
      const tmpPath = (writeSpy.mock.calls[0] as any)[0];
      expect(tmpPath).toMatch(/settings\.json\.\d+\.tmp$/);
      expect(renameSpy).toHaveBeenCalledWith(
        tmpPath,
        path.join(dir, "data", "shops", shop, "settings.json")
      );
      expect(appendSpy).toHaveBeenCalled();

      const history = await fs.readFile(
        path.join(dir, "data", "shops", shop, "settings.history.jsonl"),
        "utf8"
      );
      const entry = JSON.parse(history.trim());
      expect(entry.timestamp).toBe("2000-01-01T00:00:00.000Z");
      expect(entry.diff).toEqual({ currency: "USD" });
      writeSpy.mockRestore();
      renameSpy.mockRestore();
      appendSpy.mockRestore();
    });
  });

  it("diffHistory handles valid, invalid, and missing files", async () => {
    await withRepo(async (repo, shop, dir) => {
      const historyFile = path.join(
        dir,
        "data",
        "shops",
        shop,
        "settings.history.jsonl"
      );
      const valid = {
        timestamp: "2000-01-01T00:00:00.000Z",
        diff: { currency: "USD" },
      };
      await fs.writeFile(historyFile, JSON.stringify(valid) + "\n", "utf8");
      expect(await repo.diffHistory(shop)).toEqual([valid]);

      await fs.writeFile(historyFile, "not-json\n", "utf8");
      expect(await repo.diffHistory(shop)).toEqual([]);

      expect(await repo.diffHistory("missing")).toEqual([]);
    });
  });
});

