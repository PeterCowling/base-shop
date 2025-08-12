// packages/platform-core/__tests__/coupons.test.ts
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

let tmpDir = "";

jest.mock("@platform-core/src/dataRoot", () => ({
  resolveDataRoot: () => tmpDir,
}));

import { saveCoupons, findCoupon, type StoredCoupon } from "@platform-core/src/coupons";

const shop = "test";
const sample: StoredCoupon[] = [
  { code: "SAVE10", description: "10% off", discountPercent: 10, active: true },
];

describe("findCoupon", () => {
  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coupons-"));
    await saveCoupons(shop, sample);
  });

  it("matches coupon codes ignoring case", async () => {
    const coupon = await findCoupon(shop, sample[0].code.toLowerCase());
    expect(coupon).toEqual(sample[0]);
  });

  it("returns undefined when code is undefined or null", async () => {
    expect(await findCoupon(shop, undefined)).toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await findCoupon(shop, null as any)).toBeUndefined();
  });

  it("returns undefined for unknown codes", async () => {
    expect(await findCoupon(shop, "INVALID")).toBeUndefined();
  });
});
