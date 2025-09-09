/** @jest-environment node */

jest.mock("../common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock("@platform-core/repositories/shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(),
}));

jest.mock("@platform-core/shops", () => ({
  setSanityConfig: jest.fn(),
}));

import { deleteSanityConfig } from "../deleteSanityConfig";
import { getShopById, updateShopInRepo } from "@platform-core/repositories/shop.server";
import { setSanityConfig } from "@platform-core/shops";

describe("deleteSanityConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("disconnects Sanity for a valid shop", async () => {
    const shop = { id: "shop1" } as any;
    const updatedShop = { ...shop, sanity: null };
    (getShopById as jest.Mock).mockResolvedValue(shop);
    (setSanityConfig as jest.Mock).mockReturnValue(updatedShop);
    (updateShopInRepo as jest.Mock).mockResolvedValue(updatedShop);

    const res = await deleteSanityConfig("shop1");

    expect(res).toEqual({ message: "Sanity disconnected" });
    expect(setSanityConfig).toHaveBeenCalledWith(shop, undefined);
  });

  it("logs error and returns failure when getShopById fails", async () => {
    const err = new Error("boom");
    (getShopById as jest.Mock).mockRejectedValue(err);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await deleteSanityConfig("shop1");

    expect(errorSpy).toHaveBeenCalledWith("Failed to disconnect Sanity", err);
    expect(res).toEqual({ error: "Failed to disconnect Sanity" });

    errorSpy.mockRestore();
  });
});

