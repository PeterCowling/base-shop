// @ts-nocheck
const statMock = jest.fn((p: string) => {
  if (p.toLowerCase() === "/data/shop") {
    return Promise.resolve({ isDirectory: () => true });
  }
  const err = new Error("not found");
  err.code = "ENOENT";
  return Promise.reject(err);
});

jest.mock("@acme/platform-core/dataRoot", () => ({
  resolveDataRoot: () => "/data",
}));

jest.mock("node:fs", () => ({
  promises: { stat: (p: string) => statMock(p) },
}));

import { checkShopExists } from "../checkShopExists.server";

describe("checkShopExists", () => {
  it("detects existing shops regardless of case", async () => {
    await expect(checkShopExists("shop")).resolves.toBe(true);
    await expect(checkShopExists("Shop")).resolves.toBe(true);
  });

  it("returns false for missing shops", async () => {
    await expect(checkShopExists("missing")).resolves.toBe(false);
  });
});
