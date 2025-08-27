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

  it("rethrows unexpected errors", async () => {
    const err: NodeJS.ErrnoException = new Error("boom");
    err.code = "EACCES";
    jest.spyOn(fs, "readdir").mockRejectedValueOnce(err);

    await expect(listShops()).rejects.toBe(err);
  });
});
