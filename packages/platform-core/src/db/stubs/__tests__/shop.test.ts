/** @jest-environment node */
import { createShopDelegate } from "../shop";

describe("shop delegate", () => {
  it("returns { data: {} } from findUnique", async () => {
    const d = createShopDelegate();
    await expect(d.findUnique()).resolves.toEqual({ data: {} });
  });
});
