// packages/platform-core/__tests__/coupons.test.ts
import { COUPONS, findCoupon } from "@platform-core/src/coupons";

describe("findCoupon", () => {
  it("matches coupon codes ignoring case", () => {
    const coupon = findCoupon(COUPONS[0].code.toLowerCase());
    expect(coupon).toEqual(COUPONS[0]);
  });

  it("returns undefined when code is undefined or null", () => {
    expect(findCoupon(undefined)).toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(findCoupon(null as any)).toBeUndefined();
  });

  it("returns undefined for unknown codes", () => {
    expect(findCoupon("INVALID")).toBeUndefined();
  });
});
