import { promises as fs } from "fs";
import { listCoupons } from "../packages/platform-core/src/coupons";

describe("listCoupons", () => {
  it("returns empty array when coupons file missing", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));

    await expect(listCoupons("shop1")).resolves.toEqual([]);
  });
});
