import fs from "fs/promises";
import { listShops } from "../listShops";

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
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await expect(listShops()).rejects.toBe(err);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to list shops at"),
      err,
    );
  });
});
