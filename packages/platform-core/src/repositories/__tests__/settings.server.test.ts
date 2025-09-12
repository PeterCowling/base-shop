import * as path from "path";
import * as os from "os";

const DATA_ROOT = path.join(os.tmpdir(), "settings-tests");

jest.mock("../../dataRoot", () => ({
  DATA_ROOT,
}));

const files = new Map<string, string>();

jest.mock("fs", () => {
  return {
    promises: {
      readFile: jest.fn(async (p: string) => {
        const data = files.get(p);
        if (data === undefined) throw new Error("not found");
        return data;
      }),
      writeFile: jest.fn(async (p: string, data: string) => {
        files.set(p, data);
      }),
      rename: jest.fn(async (tmp: string, dest: string) => {
        const data = files.get(tmp);
        if (data === undefined) throw new Error("missing");
        files.set(dest, data);
        files.delete(tmp);
      }),
      appendFile: jest.fn(async (p: string, data: string) => {
        const prev = files.get(p) ?? "";
        files.set(p, prev + data);
      }),
      mkdir: jest.fn(async () => {}),
      __files: files,
    },
  };
});

jest.mock("@acme/date-utils", () => ({
  nowIso: jest.fn(() => "2020-01-01T00:00:00.000Z"),
}));

import { promises as fs } from "fs";
import { getShopSettings, saveShopSettings, diffHistory } from "../settings.server";
import { LOCALES } from "@acme/i18n";

describe("settings repository", () => {
  const fsMock = fs as unknown as typeof fs & { __files: Map<string, string> };
  const appendFileMock = fs.appendFile as unknown as jest.Mock;

  beforeEach(() => {
    fsMock.__files.clear();
    jest.clearAllMocks();
  });

  it("reads existing settings file and deep merges with defaults", async () => {
    const shop = "shop1";
    const settingsPath = path.join(DATA_ROOT, shop, "settings.json");
    fsMock.__files.set(
      settingsPath,
      JSON.stringify({
        languages: ["en"],
        depositService: { enabled: true },
        returnService: { upsEnabled: true },
        stockAlert: { recipients: ["admin@example.com"] },
        seo: { aiCatalog: { pageSize: 25 } },
      }),
    );

    const result = await getShopSettings(shop);

    expect(result.languages).toEqual(["en"]);
    expect(result.currency).toBe("EUR");
    expect(result.depositService).toEqual({ enabled: true, intervalMinutes: 60 });
    expect(result.reverseLogisticsService).toEqual({ enabled: false, intervalMinutes: 60 });
    expect(result.returnService).toEqual({
      upsEnabled: true,
      bagEnabled: false,
      homePickupEnabled: false,
    });
    expect(result.stockAlert).toEqual({ recipients: ["admin@example.com"] });
    expect(result.seo.aiCatalog).toEqual({
      enabled: true,
      fields: ["id", "title", "description", "price", "media"],
      pageSize: 25,
    });
  });

  it("falls back to defaults when settings file is missing", async () => {
    const result = await getShopSettings("missing");
    expect(result.languages).toEqual(LOCALES);
    expect(result.currency).toBe("EUR");
    expect(result.depositService).toEqual({ enabled: false, intervalMinutes: 60 });
  });

  it("falls back to defaults with invalid settings file", async () => {
    const shop = "broken";
    const settingsPath = path.join(DATA_ROOT, shop, "settings.json");
    fsMock.__files.set(settingsPath, "{not json");
    const result = await getShopSettings(shop);
    expect(result.currency).toBe("EUR");
    expect(result.returnService).toEqual({
      upsEnabled: false,
      bagEnabled: false,
      homePickupEnabled: false,
    });
  });

  it("falls back to defaults when settings fail schema validation", async () => {
    const shop = "schema-bad";
    const settingsPath = path.join(DATA_ROOT, shop, "settings.json");
    fsMock.__files.set(
      settingsPath,
      JSON.stringify({ languages: "en" }),
    );
    const result = await getShopSettings(shop);
    expect(result.languages).toEqual(LOCALES);
    expect(result.currency).toBe("EUR");
  });

  it("does not append history when settings unchanged", async () => {
    const shop = "shop2";
    const settingsPath = path.join(DATA_ROOT, shop, "settings.json");
    fsMock.__files.set(settingsPath, JSON.stringify({ languages: ["en"] }));

    const current = await getShopSettings(shop);
    await saveShopSettings(shop, current);

    expect(appendFileMock).not.toHaveBeenCalled();
    expect(fsMock.__files.get(path.join(DATA_ROOT, shop, "settings.history.jsonl"))).toBeUndefined();
  });

  it("appends diff to history when settings change", async () => {
    const shop = "shop3";
    const settingsPath = path.join(DATA_ROOT, shop, "settings.json");
    fsMock.__files.set(settingsPath, JSON.stringify({ languages: ["en"] }));

    const current = await getShopSettings(shop);
    const changed = { ...current, currency: "USD" };
    await saveShopSettings(shop, changed);

    expect(appendFileMock).toHaveBeenCalledTimes(1);

    const historyPath = path.join(DATA_ROOT, shop, "settings.history.jsonl");
    const lines = fsMock.__files.get(historyPath)!.trim().split("\n");
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.timestamp).toBe("2020-01-01T00:00:00.000Z");
    expect(parsed.diff).toEqual({ currency: "USD" });
  });

  it("diffHistory returns valid entries", async () => {
    const shop = "hist-valid";
    const historyPath = path.join(DATA_ROOT, shop, "settings.history.jsonl");
    fsMock.__files.set(
      historyPath,
      [
        JSON.stringify({ timestamp: "2020-01-01T00:00:00.000Z", diff: { currency: "USD" } }),
        JSON.stringify({ timestamp: "2020-01-02T00:00:00.000Z", diff: { taxRegion: "EU" } }),
      ].join("\n"),
    );

    const history = await diffHistory(shop);
    expect(history).toEqual([
      { timestamp: "2020-01-01T00:00:00.000Z", diff: { currency: "USD" } },
      { timestamp: "2020-01-02T00:00:00.000Z", diff: { taxRegion: "EU" } },
    ]);
  });

  it("diffHistory skips malformed JSON lines", async () => {
    const shop = "hist";
    const historyPath = path.join(DATA_ROOT, shop, "settings.history.jsonl");
    fsMock.__files.set(
      historyPath,
      [
        JSON.stringify({ timestamp: "2020-01-01T00:00:00.000Z", diff: { currency: "USD" } }),
        "not json",
        JSON.stringify({ timestamp: "bad", diff: {} }),
        JSON.stringify({ timestamp: "2020-01-02T00:00:00.000Z" }),
        JSON.stringify({ timestamp: "2020-01-03T00:00:00.000Z", diff: { taxRegion: "EU" } }),
      ].join("\n"),
    );

    const history = await diffHistory(shop);
    expect(history).toEqual([
      { timestamp: "2020-01-01T00:00:00.000Z", diff: { currency: "USD" } },
      { timestamp: "2020-01-03T00:00:00.000Z", diff: { taxRegion: "EU" } },
    ]);
  });

  it("diffHistory returns empty array when history file is missing", async () => {
    const history = await diffHistory("missing-history");
    expect(history).toEqual([]);
  });
});

describe("settings.server functions via resolved repository", () => {
  const sampleSettings = { languages: ["en"], currency: "USD" } as any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns settings provided by resolved repo", async () => {
    const repo = {
      getShopSettings: jest.fn().mockResolvedValue(sampleSettings),
      saveShopSettings: jest.fn(),
      diffHistory: jest.fn(),
    };
    jest.doMock("../repoResolver", () => ({ resolveRepo: jest.fn(() => repo) }));
    jest.doMock("../../db", () => ({ prisma: { setting: {} } }));
    const { getShopSettings } = await import("../settings.server");
    await expect(getShopSettings("shop"))
      .resolves.toEqual(sampleSettings);
    expect(repo.getShopSettings).toHaveBeenCalledWith("shop");
  });

  it("throws when resolved repo reports missing shop", async () => {
    const repo = {
      getShopSettings: jest.fn().mockRejectedValue(new Error("not found")),
      saveShopSettings: jest.fn(),
      diffHistory: jest.fn(),
    };
    jest.doMock("../repoResolver", () => ({ resolveRepo: jest.fn(() => repo) }));
    jest.doMock("../../db", () => ({ prisma: { setting: {} } }));
    const { getShopSettings } = await import("../settings.server");
    await expect(getShopSettings("missing"))
      .rejects.toThrow("not found");
    expect(repo.getShopSettings).toHaveBeenCalledWith("missing");
  });

  it("forwards saveShopSettings arguments", async () => {
    const repo = {
      getShopSettings: jest.fn(),
      saveShopSettings: jest.fn().mockResolvedValue(undefined),
      diffHistory: jest.fn(),
    };
    jest.doMock("../repoResolver", () => ({ resolveRepo: jest.fn(() => repo) }));
    jest.doMock("../../db", () => ({ prisma: { setting: {} } }));
    const { saveShopSettings } = await import("../settings.server");
    const settings = { languages: ["en"] } as any;
    await saveShopSettings("shop", settings);
    expect(repo.saveShopSettings).toHaveBeenCalledWith("shop", settings);
  });

  it("forwards diffHistory arguments", async () => {
    const history = [
      { timestamp: "2020-01-01T00:00:00.000Z", diff: { currency: "USD" } },
    ];
    const repo = {
      getShopSettings: jest.fn(),
      saveShopSettings: jest.fn(),
      diffHistory: jest.fn().mockResolvedValue(history),
    };
    jest.doMock("../repoResolver", () => ({ resolveRepo: jest.fn(() => repo) }));
    jest.doMock("../../db", () => ({ prisma: { setting: {} } }));
    const { diffHistory } = await import("../settings.server");
    await expect(diffHistory("shop"))
      .resolves.toEqual(history);
    expect(repo.diffHistory).toHaveBeenCalledWith("shop");
  });
});


