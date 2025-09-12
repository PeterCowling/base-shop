/** @jest-environment node */

import { createShopDelegate } from "../db/stubs";

describe("createShopDelegate", () => {
  it("returns an object with data when findUnique is called", async () => {
    const delegate = createShopDelegate();
    const result = await delegate.findUnique();

    expect(result).toEqual({ data: {} });
  });
});

