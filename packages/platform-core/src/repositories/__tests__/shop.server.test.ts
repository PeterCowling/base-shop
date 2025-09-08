jest.mock("../repoResolver", () => ({
  resolveRepo: jest.fn(),
}));

import { resolveRepo } from "../repoResolver";
import { getShopById, updateShopInRepo } from "../shop.server";

describe("shop.server wrapper", () => {
  const repo = {
    getShopById: jest.fn(),
    updateShopInRepo: jest.fn(),
  } as const;

  beforeEach(() => {
    (resolveRepo as jest.Mock).mockResolvedValue(repo);
    repo.getShopById.mockReset();
    repo.updateShopInRepo.mockReset();
  });

  it("delegates getShopById to the resolved repository", async () => {
    repo.getShopById.mockResolvedValue({ id: "shop1" });
    const result = await getShopById("shop1");
    expect(resolveRepo).toHaveBeenCalled();
    expect(repo.getShopById).toHaveBeenCalledWith("shop1");
    expect(result).toEqual({ id: "shop1" });
  });

  it("delegates updateShopInRepo to the resolved repository", async () => {
    repo.updateShopInRepo.mockResolvedValue({ id: "shop1", name: "Updated" });
    const patch = { id: "shop1", name: "Updated" };
    const result = await updateShopInRepo("shop1", patch);
    expect(resolveRepo).toHaveBeenCalled();
    expect(repo.updateShopInRepo).toHaveBeenCalledWith("shop1", patch);
    expect(result).toEqual({ id: "shop1", name: "Updated" });
  });
});

