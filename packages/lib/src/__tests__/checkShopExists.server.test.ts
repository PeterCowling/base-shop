import * as path from "node:path";
import type { PathLike } from "node:fs";

// Mock filesystem stat
const statMock = jest.fn();
jest.mock("node:fs", () => ({
  promises: {
    stat: (p: PathLike) => statMock(p),
  },
}));

// Mock data root resolution
const tmpDir = "/tmp";
jest.mock("@acme/platform-core/dataRoot", () => ({
  resolveDataRoot: () => tmpDir,
}));

// Spy on shop name validation
const validateMock = jest.fn((s: string) => s);
jest.mock("../validateShopName", () => ({
  validateShopName: (s: string) => validateMock(s),
}));

import { checkShopExists } from "../checkShopExists.server";

describe("checkShopExists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateMock.mockImplementation((s: string) => s);
  });

  it("resolves true when the shop directory exists", async () => {
    statMock.mockResolvedValue({ isDirectory: () => true });
    await expect(checkShopExists("shop")).resolves.toBe(true);
    expect(statMock).toHaveBeenCalledWith(path.join(tmpDir, "shop"));
  });

  it("returns false when fs.stat throws", async () => {
    const err = new Error("not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    statMock.mockRejectedValue(err);
    await expect(checkShopExists("missing")).resolves.toBe(false);
  });

  it("validates the shop name and throws for invalid input", async () => {
    const err = new Error("invalid");
    validateMock.mockImplementation(() => {
      throw err;
    });
    await expect(checkShopExists("bad!")).rejects.toThrow(err);
    expect(validateMock).toHaveBeenCalledWith("bad!");
    expect(statMock).not.toHaveBeenCalled();
  });
});
