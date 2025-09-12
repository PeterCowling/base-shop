jest.mock("../../dataRoot", () => ({ DATA_ROOT: "/data/root" }));

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

jest.mock("fs", () => ({ promises: { readdir, readFile, __files: files } }));

const validateShopName = jest.fn((s: string) => s.trim());
jest.mock("../../shops", () => ({ validateShopName }));

import { promises as fs } from "fs";
import * as path from "path";
import type { AnalyticsAggregates } from "../../analytics";
import { listEvents, readAggregates } from "../analytics.json.server";

const DATA_ROOT = "/data/root";
const readdirMock = fs.readdir as jest.Mock;
const readFileMock = fs.readFile as jest.Mock;
const memfs = (fs as any).__files as Map<string, string>;

beforeEach(() => {
  jest.clearAllMocks();
  memfs.clear();
});

describe("listEvents", () => {
  it("concatenates events across shops", async () => {
    readdirMock.mockResolvedValue([
      { name: "shop1", isDirectory: () => true },
      { name: "shop2", isDirectory: () => true },
    ]);
    const file1 = path.join(DATA_ROOT, "shop1", "analytics.jsonl");
    const file2 = path.join(DATA_ROOT, "shop2", "analytics.jsonl");
    memfs.set(file1, JSON.stringify({ type: "a" }));
    memfs.set(file2, JSON.stringify({ type: "b" }));

    const events = await listEvents();

    expect(readdirMock).toHaveBeenCalledWith(DATA_ROOT, { withFileTypes: true });
    expect(readFileMock).toHaveBeenCalledTimes(2);
    expect(events).toEqual([{ type: "a" }, { type: "b" }]);
  });

  it("skips shops with missing log files", async () => {
    readdirMock.mockResolvedValue([
      { name: "shop1", isDirectory: () => true },
      { name: "shop2", isDirectory: () => true },
    ]);
    const file1 = path.join(DATA_ROOT, "shop1", "analytics.jsonl");
    const file2 = path.join(DATA_ROOT, "shop2", "analytics.jsonl");
    memfs.set(file1, JSON.stringify({ type: "a" }));
    // shop2 file intentionally missing to trigger read error

    const events = await listEvents();

    expect(readFileMock).toHaveBeenCalledWith(file2, "utf8");
    expect(events).toEqual([{ type: "a" }]);
  });
});

describe("readAggregates", () => {
  it("returns defaults when file missing or invalid", async () => {
    const file = path.join(DATA_ROOT, "shop1", "analytics-aggregates.json");
    // no file written to memfs -> readFile throws
    const result = await readAggregates("shop1");

    expect(readFileMock).toHaveBeenCalledWith(file, "utf8");
    expect(result).toEqual<AnalyticsAggregates>({
      page_view: {},
      order: {},
      discount_redeemed: {},
      ai_crawl: {},
    });
  });
});
