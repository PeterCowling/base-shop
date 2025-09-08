jest.mock("../repoResolver", () => ({
  resolveRepo: jest.fn(),
}));

import { resolveRepo } from "../repoResolver";

describe("shop repository wrapper", () => {
  const getShop = jest.fn();
  const updateShop = jest.fn();

  beforeEach(() => {
    (resolveRepo as jest.Mock).mockResolvedValue({
      getShopById: getShop,
      updateShopInRepo: updateShop,
    });
  });

  it("delegates getShopById", async () => {
    const { getShopById } = await import("../shop.server");
    await getShopById("shop1");
    expect(getShop).toHaveBeenCalledWith("shop1");
  });

  it("delegates updateShopInRepo", async () => {
    const { updateShopInRepo } = await import("../shop.server");
    await updateShopInRepo("shop1", { id: "shop1" });
    expect(updateShop).toHaveBeenCalledWith("shop1", { id: "shop1" });
  });
});
