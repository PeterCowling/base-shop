import fs from "fs/promises";
import fs from "fs/promises";
import * as dataRootModule from "@acme/platform-core/dataRoot";
import { listShops, listShopSummaries } from "../listShops";
import { logger } from "@acme/shared-utils";

jest.mock("@acme/shared-utils", () => ({
  logger: { error: jest.fn() },
}));

describe("listShops", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns an empty array when directory is missing", async () => {
    const err: NodeJS.ErrnoException = new Error("not found");
    err.code = "ENOENT";
    jest.spyOn(fs, "readdir").mockRejectedValueOnce(err);

    await expect(listShops()).resolves.toEqual([]);
  });

  it("returns only directories from mixed entries", async () => {
    jest.spyOn(fs, "readdir").mockResolvedValueOnce([
      { name: "shop-a", isDirectory: () => true },
      { name: "file.txt", isDirectory: () => false },
      { name: "shop-b", isDirectory: () => true },
    ] as unknown as fs.Dirent[]);

    await expect(listShops()).resolves.toEqual(["shop-a", "shop-b"]);
  });

  it("logs and rethrows unexpected errors", async () => {
    const err: NodeJS.ErrnoException = new Error("boom");
    err.code = "EACCES";
    jest.spyOn(fs, "readdir").mockRejectedValueOnce(err);

    await expect(listShops()).rejects.toBe(err);
    expect(logger.error).toHaveBeenCalled();
  });
});

describe("listShopSummaries", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns defaults when deploy metadata missing", async () => {
    jest.spyOn(dataRootModule, "resolveDataRoot").mockReturnValue("/data");
    jest.spyOn(fs, "readdir").mockResolvedValueOnce([
      { name: "shop-a", isDirectory: () => true },
    ] as unknown as fs.Dirent[]);
    jest.spyOn(fs, "readFile").mockRejectedValueOnce(Object.assign(new Error("nope"), { code: "ENOENT" }));

    await expect(listShopSummaries()).resolves.toEqual([
      {
        id: "shop-a",
        name: "shop-a",
        region: null,
        pending: 0,
        status: "unknown",
        lastUpgrade: null,
      },
    ]);
  });

  it("derives status and lastUpgrade from deploy.json", async () => {
    jest.spyOn(dataRootModule, "resolveDataRoot").mockReturnValue("/data");
    jest.spyOn(fs, "readdir").mockResolvedValueOnce([
      { name: "shop-a", isDirectory: () => true },
    ] as unknown as fs.Dirent[]);
    jest.spyOn(fs, "readFile").mockResolvedValueOnce(
      JSON.stringify({
        testsStatus: "passed",
        lastTestedAt: "2025-01-01T00:00:00Z",
        region: "NA",
      })
    );

    await expect(listShopSummaries()).resolves.toEqual([
      {
        id: "shop-a",
        name: "shop-a",
        region: "NA",
        pending: 0,
        status: "up_to_date",
        lastUpgrade: "2025-01-01T00:00:00Z",
      },
    ]);
  });
});
