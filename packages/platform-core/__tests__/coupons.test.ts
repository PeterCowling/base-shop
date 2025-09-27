// packages/platform-core/__tests__/coupons.test.ts
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
 

let tmpDir = "";

jest.mock("@platform-core/dataRoot", () => ({
  resolveDataRoot: () => tmpDir,
}));

import {
  saveCoupons,
  findCoupon,
  listCoupons,
  type StoredCoupon,
} from "@platform-core/coupons";

const shop = "test";
beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coupons-"));
});

const sample: StoredCoupon[] = [
  { code: "SAVE10", description: "10% off", discountPercent: 10, active: true },
  { code: "OLD", description: "5% off", discountPercent: 5, active: false },
];

describe("listCoupons", () => {
  it("returns [] when discounts.json is missing", async () => {
    expect(await listCoupons("missing-shop")).toEqual([]);
  });

  it("parses coupons from valid JSON", async () => {
    await saveCoupons(shop, sample);
    expect(await listCoupons(shop)).toEqual(sample);
  });

  it("returns [] when discounts.json contains invalid JSON", async () => {
    const badShop = "bad";
    const shopDir = path.join(tmpDir, badShop);
    await fs.mkdir(shopDir, { recursive: true });
    await fs.writeFile(
      path.join(shopDir, "discounts.json"),
      "{ invalid",
      "utf8",
    );
    expect(await listCoupons(badShop)).toEqual([]);
  });

  it("returns [] when discounts.json does not contain an array", async () => {
    const badShop = "object";
    const shopDir = path.join(tmpDir, badShop);
    await fs.mkdir(shopDir, { recursive: true });
    await fs.writeFile(
      path.join(shopDir, "discounts.json"),
      JSON.stringify({ foo: "bar" }),
      "utf8",
    );
    expect(await listCoupons(badShop)).toEqual([]);
  });
});

describe("saveCoupons", () => {
  it("writes coupons to discounts.json", async () => {
    const shopName = "save";
    const expected = path.join(tmpDir, shopName, "discounts.json");
    const mkdirSpy = jest
      .spyOn(fs, "mkdir")
      .mockResolvedValue(undefined as never);
    const writeSpy = jest
      .spyOn(fs, "writeFile")
      .mockResolvedValue(undefined as never);

    await saveCoupons(shopName, sample);

    expect(mkdirSpy).toHaveBeenCalledWith(path.dirname(expected), {
      recursive: true,
    });
    expect(writeSpy).toHaveBeenCalledWith(
      expected,
      JSON.stringify(sample, null, 2),
      "utf8",
    );

    mkdirSpy.mockRestore();
    writeSpy.mockRestore();
  });
});

describe("findCoupon", () => {
  beforeAll(async () => {
    await saveCoupons(shop, sample);
  });

  it("matches coupon codes ignoring case", async () => {
    const coupon = await findCoupon(shop, sample[0].code.toLowerCase());
    expect(coupon).toEqual(sample[0]);
  });

  it("returns undefined when code is undefined or null", async () => {
    expect(await findCoupon(shop, undefined)).toBeUndefined();
    expect(await findCoupon(shop, null)).toBeUndefined();
  });

  it("ignores inactive coupons", async () => {
    expect(await findCoupon(shop, sample[1].code)).toBeUndefined();
  });

  it("returns undefined for unknown codes", async () => {
    expect(await findCoupon(shop, "INVALID")).toBeUndefined();
  });
});
