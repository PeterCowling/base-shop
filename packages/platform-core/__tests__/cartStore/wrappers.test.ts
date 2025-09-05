import { jest } from "@jest/globals";

describe("cartStore wrapper functions", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("delegates operations to the default store", async () => {
    const store = {
      createCart: jest.fn().mockResolvedValue("id"),
      getCart: jest.fn().mockResolvedValue({}),
      setCart: jest.fn().mockResolvedValue(undefined),
      deleteCart: jest.fn().mockResolvedValue(undefined),
      incrementQty: jest.fn().mockResolvedValue({}),
      setQty: jest.fn().mockResolvedValue(null),
      removeItem: jest.fn().mockResolvedValue(null),
    };

    const mod: any = await import("../../src/cartStore");
    mod.__setDefaultCartStore(store);

    await mod.createCart();
    expect(store.createCart).toHaveBeenCalledTimes(1);

    await mod.getCart("c1");
    expect(store.getCart).toHaveBeenCalledWith("c1");

    await mod.setCart("c1", { foo: 1 } as any);
    expect(store.setCart).toHaveBeenCalledWith("c1", { foo: 1 });

    await mod.deleteCart("c1");
    expect(store.deleteCart).toHaveBeenCalledWith("c1");

    await mod.incrementQty("c1", { id: "sku" } as any, 2);
    expect(store.incrementQty).toHaveBeenCalledWith(
      "c1",
      { id: "sku" },
      2,
      undefined
    );

    await mod.setQty("c1", "sku", 3);
    expect(store.setQty).toHaveBeenCalledWith("c1", "sku", 3);

    await mod.removeItem("c1", "sku");
    expect(store.removeItem).toHaveBeenCalledWith("c1", "sku");
  });

  it("recreates default store when cleared", async () => {
    const store = {
      createCart: jest.fn().mockResolvedValue("id"),
      getCart: jest.fn(),
      setCart: jest.fn(),
      deleteCart: jest.fn(),
      incrementQty: jest.fn(),
      setQty: jest.fn(),
      removeItem: jest.fn(),
    } as const;

    const mod: any = await import("../../src/cartStore");
    const factorySpy = jest
      .spyOn(mod, "createCartStore")
      .mockReturnValue(store as any);

    mod.__setDefaultCartStore(null);
    await mod.createCart();
    expect(factorySpy).toHaveBeenCalledTimes(1);
  });
});

