/** @jest-environment node */

import { createShopDelegate } from "../db/stubs";

describe("createShopDelegate", () => {
  it("returns a fresh object each time findUnique is called", async () => {
    const delegate = createShopDelegate();

    const result1 = await delegate.findUnique();
    const result2 = await delegate.findUnique();

    expect(result1).toEqual({ data: {} });
    expect(result2).toEqual({ data: {} });
    expect(result1).not.toBe(result2);
  });
});

