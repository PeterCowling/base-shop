import { createShopDelegate } from "../src/db/stubs/shop";

describe("createShopDelegate", () => {
  it("returns an object with data when findUnique is called", async () => {
    const delegate = createShopDelegate();
    await expect(delegate.findUnique()).resolves.toMatchObject({ data: {} });
  });
});
