jest.mock("../../dataRoot", () => ({
  DATA_ROOT: "/data/root",
}));

const files = new Map<string, string>();
const readdir = jest.fn(async () => []);
const readFile = jest.fn(async (p: string) => {
  const data = files.get(p);
  if (data === undefined) {
    const err = new Error("not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    throw err;
  }
  return data;
});

jest.mock("fs", () => ({
  promises: {
    readdir,
    readFile,
    __files: files,
  },
}));

const validateShopName = jest.fn((s: string) => s.trim());
jest.mock("../../shops", () => ({ validateShopName }));

import { promises as fs } from "fs";
import * as path from "path";
import type { AnalyticsAggregates } from "../../analytics";
import { listEvents, readAggregates } from "../analytics.server";

const DATA_ROOT = "/data/root";
const readdirMock = fs.readdir as jest.Mock;
const readFileMock = fs.readFile as jest.Mock;
const memfs = (fs as any).__files as Map<string, string>;

beforeEach(() => {
  jest.clearAllMocks();
  memfs.clear();
  validateShopName.mockImplementation((s: string) => s.trim());
});

describe("listEvents", () => {
  it("reads events for a specific shop and normalizes the name", async () => {
    validateShopName.mockImplementation((s) => s.trim().toLowerCase());
    const file = path.join(DATA_ROOT, "shop1", "analytics.jsonl");
    memfs.set(
      file,
      JSON.stringify({ type: "a" }) +
        "\nnot json\n" +
        JSON.stringify({ type: "b" }) +
        "\n"
    );

    const events = await listEvents(" SHOP1 ");

    expect(validateShopName).toHaveBeenCalledWith(" SHOP1 ");
    expect(readFileMock).toHaveBeenCalledWith(file, "utf8");
    expect(events).toEqual([{ type: "a" }, { type: "b" }]);
  });

  it("returns empty array when log file is missing", async () => {
    const file = path.join(DATA_ROOT, "shop1", "analytics.jsonl");
    const events = await listEvents("shop1");

    expect(readFileMock).toHaveBeenCalledWith(file, "utf8");
    expect(events).toEqual([]);
  });

  it("aggregates events from all shops and skips missing files", async () => {
    readdirMock.mockResolvedValue([
      { name: "shop1", isDirectory: () => true },
      { name: "shop2", isDirectory: () => true },
    ]);
    const file1 = path.join(DATA_ROOT, "shop1", "analytics.jsonl");
    memfs.set(file1, JSON.stringify({ type: "a" }) + "\ninvalid\n");

    const events = await listEvents();

    expect(readdirMock).toHaveBeenCalledWith(DATA_ROOT, {
      withFileTypes: true,
    });
    expect(readFileMock).toHaveBeenCalledTimes(2);
    expect(events).toEqual([{ type: "a" }]);
  });
});

describe("readAggregates", () => {
  it("returns parsed aggregates when file exists", async () => {
    validateShopName.mockImplementation((s) => s.trim().toLowerCase());
    const file = path.join(DATA_ROOT, "shop1", "analytics-aggregates.json");
    const agg: AnalyticsAggregates = {
      page_view: { d: 1 },
      order: { d: { count: 2, amount: 3 } },
      discount_redeemed: { d: { CODE: 4 } },
      ai_crawl: { d: 5 },
    };
    memfs.set(file, JSON.stringify(agg));

    const result = await readAggregates(" SHOP1 ");

    expect(validateShopName).toHaveBeenCalledWith(" SHOP1 ");
    expect(readFileMock).toHaveBeenCalledWith(file, "utf8");
    expect(result).toEqual(agg);
  });

  it("returns zeroed aggregates when file missing", async () => {
    const file = path.join(DATA_ROOT, "shop1", "analytics-aggregates.json");
    const result = await readAggregates("shop1");

    expect(readFileMock).toHaveBeenCalledWith(file, "utf8");
    expect(result).toEqual({
      page_view: {},
      order: {},
      discount_redeemed: {},
      ai_crawl: {},
    });
  });
});

