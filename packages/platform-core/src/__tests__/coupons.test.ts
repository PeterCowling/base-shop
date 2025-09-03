import { promises as fs } from "node:fs";
import { listCoupons } from "../coupons";

describe("listCoupons", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns empty array when coupons file missing", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));

    await expect(listCoupons("demo")).resolves.toEqual([]);
  });
});
