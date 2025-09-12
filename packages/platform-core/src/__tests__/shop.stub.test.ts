/** @jest-environment node */

import { createShopDelegate } from "../db/stubs";

describe("createShopDelegate", () => {
  it("returns an object with data when findUnique is called", async () => {
    const delegate = createShopDelegate();

    await expect(delegate.findUnique()).resolves.toMatchObject({ data: {} });
  });
});

